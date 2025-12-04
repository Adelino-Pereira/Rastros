import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import "./components/Sidebar.css";
import Board from "./components/Board";
import MoveLog from "./components/MoveLog";
import { WinnerMessage } from "./components/WinnerMessage";
import { PuzzleDialog } from "./components/PuzzleDialog";
import { AiMoveWarningDialog } from "./components/AiMoveWarningDialog";
import { SettingsPanel } from "./components/SettingsPanel";
import { ProblemPanel } from "./components/ProblemPanel";
import { initWasm } from "./wasm/gameAPI";
import { generateLogText } from "./utils/generateLogText";
import WinHistoryDialog from "./components/WinHistoryDialog";
import { recordAiVsGame, MODES } from "./utils/winHistory";
import RulesDialog from "./components/RulesDialog";
import { GameEngineProvider, useGameEngineContext } from "./engine/GameEngineContext.jsx";
import Sound from "./utils/soundManager";

function AppContent({
  sidebarOpen,
  setSidebarOpen,
  theme,
  setTheme,
  showHistory,
  setShowHistory,
  rulesOpen,
  setRulesOpen,
  soundOn,
  setSoundOn,
  puzzleDialogOpen,
  setPuzzleDialogOpen,
  aiMoveWarnOpen,
  setAiMoveWarnOpen,
  aiMoveDontWarnAgain,
  setAiMoveDontWarnAgain,
}) {
  const lastLoggedKeyRef = useRef(null);
  const {
    state,
    dispatch,
    handleStartGame,
    handleCellClick,
    handleAiTurn,
    isAiTurn,
    startRandomProblem,
    resetProblem,
    onAiMoveClick,
  } = useGameEngineContext();

  useEffect(() => {
    if (
      state.problem?.status === "success" ||
      state.problem?.status === "failed"
    ) {
      setPuzzleDialogOpen(true);
    }
  }, [state.problem?.status, setPuzzleDialogOpen]);

  useEffect(() => {
    if (!state.problem?.current) return;
    if (state.problem.status !== "active") return;
    if (state.winner === null) return;

    const humanIsP1 = !state.ai1;
    const humanWon = state.winner === (humanIsP1 ? 1 : 2);

    dispatch({
      type: "PROBLEM_SET_STATUS",
      payload: humanWon ? "success" : "failed",
    });
  }, [dispatch, state.ai1, state.problem, state.winner]);

  function getBestMovesForPuzzle(p) {
    if (!p) return null;
    if (typeof p.movesLimit === "number") return p.movesLimit;
    if (p.solution && typeof p.solution.optimalLength === "number")
      return p.solution.optimalLength;
    return null;
  }

  useEffect(() => {
    Sound.attachAutoUnlock(); // unlock on first tap/click/keypress
    Sound.preload(); // optional: warm-up
  }, []);

  useEffect(() => {
    Sound.setMuted(!soundOn);
    localStorage.setItem("soundOn", String(soundOn));
    if (soundOn) {
      Sound.play("button");
    }
  }, [soundOn]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.classList.remove("light", "dark");
      document.body.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    initWasm().then((Module) => {
      Module.initHeuristics();
      dispatch({ type: "SET_WASM", payload: Module });
    });
  }, [dispatch]);

  useEffect(() => {
    if (state.wasm) {
      dispatch({ type: "RESET_GAME" });
    }
  }, [dispatch, state.wasm]);

  const {
    grid,
    marker,
    validMoves,
    size,
    moveLog,
    currentPlayer,
    resetKey,
    winner,
    mode,
  } = state;

  useEffect(() => {
    if (!state.gameStarted || state.winner !== null) return;

    const { currentPlayer, mode, ai1, ai2 } = state;

    const shouldAIPlay =
      (mode === "human_first" && currentPlayer === 1) ||
      (mode === "ai_first" && currentPlayer === 0) ||
      mode === "ai_vs_ai";

    if (shouldAIPlay) {
      const aiForTurn = currentPlayer === 0 ? ai1 : ai2;
      if (shouldAIPlay && aiForTurn) {
        setTimeout(() => handleAiTurn(), 100);
      }
    }
  }, [state.currentPlayer]);

  useEffect(() => {
    if (!state.isTurnEnded) return;

    const { board } = state;

    board.switchPlayer();
    dispatch({ type: "SWITCH_PLAYER" });
    dispatch({ type: "UPDATE_STATE" });
  }, [dispatch, state.isTurnEnded]);

  useEffect(() => {
    if (
      state.gameStarted &&
      state.round === 0 &&
      (state.mode === "ai_first" || state.mode === "ai_vs_ai") &&
      state.currentPlayer === 0
    ) {
      setTimeout(() => handleAiTurn(), 200);
    }
  }, [state.gameStarted]);

  const handleDownloadLog = () => {
    const text = generateLogText(moveLog, grid.length);
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}_${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(
      now.getSeconds()
    )}s`;

    link.download = `${state.mode}_${state.rows}x${state.cols}_d-${state.difficulty}_${timestamp}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleHistoryclick = () => {
    Sound.play("button");
    setShowHistory(true);
  };

  const handleDificultySelector = (val) => {
    Sound.play("slide");
    dispatch({ type: "SET_DIFFICULTY", payload: val });
  };

  function normalizeWinnerCode(w) {
    if (w === 1 || w === 2) return w;
    if (w > 2) {
      const n = Math.floor(w / 3);
      return n === 1 || n === 2 ? n : null;
    }
    return null;
  }

  useEffect(() => {
    const { winner, mode, difficulty, resetKey, rows, cols } = state;
    if (winner == null) return;
    if (lastLoggedKeyRef.current === resetKey) return;
    if (state.skipStatsThisMatch) return;

    const wn = normalizeWinnerCode(winner);
    if (!wn) return;

    if (mode !== MODES.HUMAN_FIRST && mode !== MODES.AI_FIRST) return;

    const level = String(difficulty ?? "1"); // your app’s selected level (1..10)
    const board = `${rows}x${cols}`;
    recordAiVsGame({ mode, level, winner: wn, board });

    lastLoggedKeyRef.current = resetKey;
  }, [state.winner]);

  return (
    <div className="app">
      <header className="rb-header">
        <button
          className="rb-burger"
          aria-label="Abrir opções"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="var(--text)"
          >
            <rect x="3" y="5" width="18" height="2" rx="1"></rect>
            <rect x="3" y="11" width="18" height="2" rx="1"></rect>
            <rect x="3" y="17" width="18" height="2" rx="1"></rect>
          </svg>
        </button>
        <h1 style={{ margin: 10 }}>Rastros</h1>
      </header>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={300}
      >
        <h2 style={{ marginTop: 0, color: "black" }}>Configurações</h2>
        <SettingsPanel
          mode={mode}
          onSelectMode={(m) => dispatch({ type: "SET_MODE", payload: m })}
          rows={state.rows}
          cols={state.cols}
          onSelectDims={(dims) => dispatch({ type: "SET_DIMENSIONS", payload: dims })}
          difficulty={state.difficulty}
          onChangeDifficulty={handleDificultySelector}
          gameStarted={state.gameStarted}
          onHistory={handleHistoryclick}
          onOpenRules={() => setRulesOpen(true)}
          soundOn={soundOn}
          onToggleSound={(on) => setSoundOn(on)}
          theme={theme}
          onChangeTheme={(e) => setTheme(e.target.value)}
        />

        <hr style={{ margin: "12px 0" }} />
        <ProblemPanel
          problemState={state.problem}
          onStartRandom={startRandomProblem}
          onReset={resetProblem}
        />
      </Sidebar>

      <div className="buttons">
        {state.gameStarted && !state.problem?.current && (
          <button onClick={onAiMoveClick} disabled={isAiTurn()}>
            Fazer jogada IA
          </button>
        )}

        {!state.gameStarted && (
          <button className="start-btn" onClick={handleStartGame}>
            Iniciar
          </button>
        )}
        {state.gameStarted && (
          <button
            className="start-btn"
            onClick={() => dispatch({ type: "RESET_GAME" })}
          >
            Reiniciar
          </button>
        )}

        {state.problem?.current && (
          <p className="puzzle-player-info">
            Joga o jogador{state.problem.current.playerToMove}
          </p>
        )}
        <div className="game-area">
          {Array.isArray(grid) && grid.length > 0 && grid[0]?.length > 0 ? (
            <Board
              grid={grid}
              marker={marker}
              validMoves={validMoves}
              onCellClick={handleCellClick}
              gameStarted={state.gameStarted}
            />
          ) : (
            <p> Grid not initialized</p>
          )}

          <MoveLog
            log={moveLog}
            currentPlayer={currentPlayer}
            gridSize={grid.length}
            resetKey={resetKey}
          />
        </div>

        {!state.problem?.current && (
          <WinnerMessage
            winner={winner}
            onDownload={handleDownloadLog}
            onBack={() => dispatch({ type: "SET_WINNER", payload: null })}
          />
        )}

        <PuzzleDialog
          open={puzzleDialogOpen}
          problemState={state.problem}
          getBestMovesForPuzzle={getBestMovesForPuzzle}
          onClose={() => setPuzzleDialogOpen(false)}
          onRetry={() => {
            setPuzzleDialogOpen(false);
            resetProblem();
          }}
          onNext={() => {
            setPuzzleDialogOpen(false);
            startRandomProblem();
          }}
        />

        <AiMoveWarningDialog
          open={aiMoveWarnOpen}
          dontWarnAgain={aiMoveDontWarnAgain}
          onToggleDontWarn={setAiMoveDontWarnAgain}
          onCancel={() => setAiMoveWarnOpen(false)}
          onProceed={() => {
            if (aiMoveDontWarnAgain) {
              localStorage.setItem("aiMoveWarnDisabled", "1");
            }
            dispatch({ type: "SKIP_STATS_THIS_MATCH" });
            setAiMoveWarnOpen(false);
            handleAiTurn(true);
          }}
        />
      </div>
      <WinHistoryDialog
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [showHistory, setShowHistory] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => {
    const saved = localStorage.getItem("soundOn");
    return saved ? saved === "true" : true;
  });

  const [puzzleDialogOpen, setPuzzleDialogOpen] = useState(false);

  const [aiMoveWarnOpen, setAiMoveWarnOpen] = useState(false);
  const [aiMoveDontWarnAgain, setAiMoveDontWarnAgain] = useState(
    () => localStorage.getItem("aiMoveWarnDisabled") === "1"
  );

  const closeSidebarIfMobile = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 992) {
      setSidebarOpen(false);
    }
  }, []);

  const uiRefs = useMemo(
    () => ({
      setPuzzleDialogOpen,
      setAiMoveWarnOpen,
      aiMoveDontWarnAgain,
      setAiMoveDontWarnAgain,
      closeSidebarIfMobile,
    }),
    [aiMoveDontWarnAgain, closeSidebarIfMobile]
  );

  return (
    <GameEngineProvider uiRefs={uiRefs}>
      <AppContent
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        theme={theme}
        setTheme={setTheme}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
        rulesOpen={rulesOpen}
        setRulesOpen={setRulesOpen}
        soundOn={soundOn}
        setSoundOn={setSoundOn}
        puzzleDialogOpen={puzzleDialogOpen}
        setPuzzleDialogOpen={setPuzzleDialogOpen}
        aiMoveWarnOpen={aiMoveWarnOpen}
        setAiMoveWarnOpen={setAiMoveWarnOpen}
        aiMoveDontWarnAgain={aiMoveDontWarnAgain}
        setAiMoveDontWarnAgain={setAiMoveDontWarnAgain}
      />
    </GameEngineProvider>
  );
}

export default App;
