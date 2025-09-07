import React, { useEffect, useReducer,useState,useRef } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar"; // <-- add
import "./components/Sidebar.css";    
import ModeSelector from "./components/ModeSelector";
import GridSizeSelector from "./components/GridSizeSelector";
import Board from "./components/Board";
import MoveLog from "./components/MoveLog";
import DifficultySelector from "./components/DifficultySelector";
import { initWasm } from "./wasm/gameAPI";
import { gameReducer, initialState } from "./state/gameReducer";
import { getFirstMoveAI } from "./utils/getFirstMoveAI";
import { generateLogText } from "./utils/generateLogText";
import WinHistoryDialog from "./components/WinHistoryDialog";
import { recordAiVsGame, MODES } from "./utils/winHistory";
import RulesDialog from "./components/RulesDialog";
import problems from "./data/problems.json";
import { applyPuzzleToEngine } from "./utils/applyPuzzleToEngine";

import Sound from "./utils/soundManager";

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState("dark");

  const [showHistory, setShowHistory] = useState(false);
  const lastLoggedKeyRef = useRef(null);

  const [rulesOpen, setRulesOpen] = useState(false);

  const [soundOn, setSoundOn] = useState(() => {
    const saved = localStorage.getItem("soundOn");
    return saved ? saved === "true" : true;
  });

  const [problemHumanSide, setProblemHumanSide] = useState("P1");

  const [puzzleDialogOpen, setPuzzleDialogOpen] = useState(false);


  // Aviso ao usar "Fazer jogada IA"
  const [aiMoveWarnOpen, setAiMoveWarnOpen] = useState(false);
  const [aiMoveDontWarnAgain, setAiMoveDontWarnAgain] = useState(
    () => localStorage.getItem("aiMoveWarnDisabled") === "1"
  );


  useEffect(() => {
    if (state.problem?.status === "success" || state.problem?.status === "failed") {
      setPuzzleDialogOpen(true);
    }
  }, [state.problem?.status]);


  // If the AI wins while a puzzle is active, mark as failed
  useEffect(() => {
    if (!state.problem?.current) return;
    if (state.problem.status !== "active") return;
    if (state.winner === null) return;

    // We create exactly one AI for the opposite side:
    // - If ai1 is null, human is P1; else human is P2.
    const humanIsP1 = !state.ai1;
    const humanWon = state.winner === (humanIsP1 ? 1 : 2);

    dispatch({ type: "PROBLEM_SET_STATUS", payload: humanWon ? "success" : "failed" });
  }, [state.winner]);

  function getBestMovesForPuzzle(p) {
    if (!p) return null;
    if (typeof p.movesLimit === "number") return p.movesLimit;
    if (p.solution && typeof p.solution.optimalLength === "number") return p.solution.optimalLength;
    return null;
  }


  useEffect(() => {
    Sound.attachAutoUnlock(); // unlock on first tap/click/keypress
    Sound.preload();          // optional: warm-up
  }, []);

  // keep SoundManager in sync with the checkbox
  useEffect(() => {
    Sound.setMuted(!soundOn);
    localStorage.setItem("soundOn", String(soundOn));
    if (soundOn) {Sound.play("button");}

  }, [soundOn]);

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);


  // Carregar WASM e fazer reset do jogo quando carregado
  useEffect(() => {
    initWasm().then((Module) => {
      Module.initHeuristics();  // register all levels
      dispatch({ type: "SET_WASM", payload: Module });
    });
  }, []);

  useEffect(() => {
    if (state.wasm) {
      dispatch({ type: "RESET_GAME" });
    }
    //console.log("size",state.board);
  }, [state.wasm]);

  //configurações do inicio de jogo
  const handleStartGame = () => {
    const { wasm, size, mode, startDepth, maxDepth, difficulty } = state;
    if (!wasm) return;

    // leaving puzzle flow → clear puzzle state & dialog
    dispatch({ type: "PROBLEM_CLEAR" });
    setPuzzleDialogOpen(false);

    const board = new wasm.Board(state.rows, state.cols)

    // const ai1 = new wasm.AI(true, maxDepth);
    // const ai2 = new wasm.AI(false, maxDepth);

    const ai1 = wasm.createAIWithLevel(true, maxDepth, difficulty,1);
    const ai2 = wasm.createAIWithLevel(false, maxDepth, difficulty,1);

    const rawGrid = board.getGrid();
    const grid = [];
    for (let i = 0; i < rawGrid.size(); i++) {
      const row = rawGrid.get(i);
      const rowArr = [];
      for (let j = 0; j < row.size(); j++) {
        rowArr.push(row.get(j));
      }
      grid.push(rowArr);
    }

    const rawMoves = board.getValidMoves();
    const validMoves = [];
    for (let i = 0; i < rawMoves.size(); i++) {
      const move = rawMoves.get(i);
      validMoves.push([move.get(0), move.get(1)]);
    }

    dispatch({
      type: "INIT_GAME",
      payload: {
        board,
        ai1,
        ai2,
        grid,
        marker: board.marker,
        validMoves,
      },
    });
  };

  //jogada do jogador humano
  const handleCellClick = (r, c) => {
    

    const { board, validMoves, winner, } = state;

    if (!state.gameStarted || winner || isAiTurn()) return;
    //if (winner || mode.startsWith("ai") || isAiTurn()) return;

    const valid = validMoves.some(([vr, vc]) => vr === r && vc === c);
    if (!valid) return;

    board.makeMove([r, c]);
    Sound.play("move")
    dispatch({ type: "APPLY_MOVE", payload: { move: [r, c] } });
    dispatch({ type: "UPDATE_STATE" });
    dispatch({ type: "INCREMENT_ROUND" });

    // PROBLEM: track moves + evaluate
    if (state.problem?.status === "active") {
      const nextMoves = (state.problem?.movesMade ?? 0) + 1;
      dispatch({ type: "PROBLEM_MOVE" });
      evaluateProblemAfterMove(nextMoves);
    }

    endTurn();
  };


  // verificar se é IA a jogar
  const isAiTurn = () => {
    const { mode, currentPlayer } = state;
    if (mode === "human_vs_human") return false;
    if (mode === "human_first" && currentPlayer === 1) return true;
    if (mode === "ai_first" && currentPlayer === 0) return true;
    if (mode === "ai_vs_ai") return true;
    return false;
  };

  //verificação final de turno
  const endTurn = () => {
    const { board } = state;

    if (board.isTerminal()) {
      dispatch({ type: "SET_WINNER", payload: board.getWinner() });
      console.log("Game over! Winner:", board.getWinner());
      if ((state.mode === "human_first" && (board.getWinner() === 1 || board.getWinner() === 3)) ||
          (state.mode === "ai_first" && (board.getWinner() === 2 || board.getWinner() === 6))||
          (state.mode === "human_vs_human")) {
        Sound.play("win");
      }
      if ((state.mode === "human_first" && (board.getWinner() === 2 || board.getWinner() === 6)) ||
           (state.mode === "ai_first" && (board.getWinner() === 1 || board.getWinner() === 3))){
        Sound.play("lose");
      }
    } else {
      dispatch({ type: "END_TURN" }); // triggers useEffect below
    }

  };

  //jogada IA
  const handleAiTurn = (AImoveButn=false) => {
    // console.log("AImoveButn",AImoveButn);
    Sound.play("move");
    const { board, ai1, ai2, currentPlayer, round, size, startDepth, maxDepth } = state;
    //const ai = currentPlayer === 0 ? ai1 : ai2;

    let ai = currentPlayer === 0 ? ai1 : ai2;
    console.log("ai",ai);
    console.log("currentPlayer",currentPlayer);
    if (AImoveButn==true){
      
        ai = state.wasm.createAIWithLevel(
          currentPlayer === 0,   // true => P1 AI, false => P2 AI
          state.maxDepth,
          10,                    // <-- force difficulty 10 for this move
          5                     // debug level as you prefer
        );

    }else if (!ai) {
       const levelForThisMove = AImoveButn ? 10 : state.difficulty;
       console.log("levelForThisMove",levelForThisMove);
       ai = state.wasm.createAIWithLevel(
         currentPlayer === 0,     // true => AI for P1, false => P2
         state.maxDepth,
         levelForThisMove,
         1
       );
     }

    let move;
    let depth;
    let currentDifficulty = state.difficulty;

    // if (state.problem?.status === "active"){
    //   currentDifficulty = 10;
    // }
    
    const cond1 = (state.rows >= 9 || state.cols>= 9) && state.mode == "ai_vs_ai";
    const cond2 = state.rows >= 10 || state.cols>= 10 && state.mode

    if (state.difficulty == 1){ depth = 1;}

    if ((cond1 || cond2) && !AImoveButn) {
      depth = 7;
    }else{
      // if(state.rows==7 && state.cols== 7){
      //   state.startDepth = 11;
      //   state.maxDepth = 20;
      if (state.rows >= 8 || state.cols>= 8) {
        state.startDepth = 7;
        state.maxDepth = 11;
      }

      // }
      depth = Math.min(startDepth + Math.floor(round / 5), maxDepth);
      depth = (depth % 2 === 0) ? depth - 1 : depth;
      depth = Math.max(depth, startDepth);
    }
    if (AImoveButn==false && state.problem?.status === "idle"){
      if (state.difficulty == 1){ depth = 1;}
      else if (state.difficulty == 2){ depth = 1;}
      else if (state.difficulty == 3){ depth = 3;}
      else if (state.difficulty == 4){ depth = 3;}
      else if (state.difficulty == 5){ depth = 4;}
      else{depth = depth;}
    }else{
      dispatch({ type: "SET_DIFFICULTY", payload: 10 })
    }
    
    // if (AImoveButn==true){
      
    //   dispatch({ type: "SET_DIFFICULTY", payload:10 })
    //   console.log("cd-",currentDifficulty)
    // }



    console.log(` AI ${currentPlayer} searching with depth ${depth}`);
    console.log("round",round)
    move = ai.chooseMove(board, depth,round);
    console.log(move);
    

    board.makeMove(move);
    dispatch({ type: "APPLY_MOVE", payload: { move } });
    dispatch({ type: "UPDATE_STATE" });
    dispatch({ type: "INCREMENT_ROUND" });


    setTimeout(() => {
      endTurn();
    }, 50);
  };


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


  // para verificar em cada render the página se AI joga de acordo com estado atual
  //Ver melhor isto:
  // em cima tem tb a funçao isAiTurn que é usada em handleClick que faz o mesmo
  //este usefect foi acrescentado por causa da atualizaçao d estados do React
  useEffect(() => {
    if (!state.gameStarted || state.winner !== null) return;

    //const { board, currentPlayer, mode } = state;
    const { currentPlayer, mode, ai1, ai2 } = state;

    const shouldAIPlay =
      (mode === "human_first" && currentPlayer === 1) ||
      (mode === "ai_first" && currentPlayer === 0) ||
      (mode === "ai_vs_ai");

    if (shouldAIPlay) {
      const aiForTurn = currentPlayer === 0 ? ai1 : ai2;
      if (shouldAIPlay && aiForTurn) {
        setTimeout(() => handleAiTurn(), 100);
      }
    }
  }, [state.currentPlayer]);


  // verificar se o turno terminou e mudar de jogador
  useEffect(() => {
    if (!state.isTurnEnded) return;

    const { board } = state;

    board.switchPlayer(); // internal C++ state
    dispatch({ type: "SWITCH_PLAYER" });
    dispatch({ type: "UPDATE_STATE" });
  }, [state.isTurnEnded]);


  //IA joga primeiro
  useEffect(() => {
    if (
      state.gameStarted &&
      state.round === 0 &&
      (state.mode === "ai_first"|| state.mode === "ai_vs_ai") &&
      state.currentPlayer === 0
    ) {
      //console.log(" Starting game with AI first turn...");
      setTimeout(() => handleAiTurn(), 200);
    }
  }, [state.gameStarted]);


  //download do registo de jogo usa utils/generateLogs.js
  const handleDownloadLog = () => {
    const text = generateLogText(moveLog, grid.length); // assuming grid is defined
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}m${pad(now.getSeconds())}s`;


    link.download = `${state.mode}_${state.rows}x${state.cols}_d-${state.difficulty}_${timestamp}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleHistoryclick =()=>{
    Sound.play("button");
    setShowHistory(true);

  }

  const handleDificultySelector =(val)=>{
    Sound.play("slide");
    dispatch({ type: "SET_DIFFICULTY", payload: val })
  }

 // log de estados em cada carregamento
  // useEffect(() => {
  //   console.log("[App] Full state updated:", state);
  // }, [state]);

  // small helper to close sidebar on desktop no-op; on mobile, close after clicking Start
  const closeSidebarIfMobile = () => {
    if (window.innerWidth < 992) setSidebarOpen(false);
  };


   // Convert  winner code to 1 or 2 (ignore other kinds)
  function normalizeWinnerCode(w) {
    if (w === 1 || w === 2) return w;
    if (w > 2) { // if you encode blocked endings as multiples, keep the "winner side"
      const n = Math.floor(w / 3);
      return n === 1 || n === 2 ? n : null;
    }
    return null;
  }

  useEffect(() => {
    const { winner, mode, difficulty, resetKey, rows, cols } = state;
    if (winner == null) return;                 // no result yet
    if (lastLoggedKeyRef.current === resetKey) return; // already logged this match
    if (state.skipStatsThisMatch) return;

    const wn = normalizeWinnerCode(winner);
    if (!wn) return;

    // Only for AI vs games (human_first or ai_first). Ignore human_vs_human / ai_vs_ai.
    if (mode !== MODES.HUMAN_FIRST && mode !== MODES.AI_FIRST) return;

    const level = String(difficulty ?? "1");    // your app’s selected level (1..10)
    const board = `${rows}x${cols}`;
    recordAiVsGame({ mode, level, winner: wn, board });

    lastLoggedKeyRef.current = resetKey;
  }, [state.winner]);


  //NEW
  // Build grid + validMoves from WASM vectors (same pattern as handleStartGame)
  function buildGridAndMoves(board) {
    const rawGrid = board.getGrid();
    const grid = [];
    for (let i = 0; i < rawGrid.size(); i++) {
      const row = rawGrid.get(i);
      const rowArr = [];
      for (let j = 0; j < row.size(); j++) rowArr.push(row.get(j));
      grid.push(rowArr);
    }
    const rawMoves = board.getValidMoves();
    const validMoves = [];
    for (let i = 0; i < rawMoves.size(); i++) {
      const mv = rawMoves.get(i);
      validMoves.push([mv.get(0), mv.get(1)]);
    }
    return { grid, validMoves };
  }

  // Count black markers (blocked cells) on the board grid
  function countBlocked(board) {
    const rawGrid = board.getGrid();
    let blocked = 0;
    for (let i = 0; i < rawGrid.size(); i++) {
      const row = rawGrid.get(i);
      for (let j = 0; j < row.size(); j++) {
        if (row.get(j) === 0) blocked++;
      }
    }
    return blocked;
  }

  // Given blockedCount, return 1 or 2 (player to move) by your parity rule
  function whoMovesFromParity(blockedCount) {
    const totalMarkers = blockedCount + 1; // +1 for the white marker
    return (totalMarkers % 2 === 1) ? 1 : 2; // odd -> P1, even -> P2
  }

  function startRandomProblem() {
    const { wasm } = state;
    if (!wasm) return;
    setPuzzleDialogOpen(false);

    const p = problems[Math.floor(Math.random() * problems.length)];
    const board = new wasm.Board(p.rows, p.cols);

    console.log("playerToMove",p.playerToMove);
    applyPuzzleToEngine(p, board);

    const blocked = countBlocked(board);
    const playerToMove = whoMovesFromParity(blocked); // 1 or 2
    board.setCurrentPlayerInt(playerToMove);

    // Human always plays the side to move
    const humanIsP1 = (playerToMove === 1);
    const ai1 = humanIsP1 ? null : wasm.createAIWithLevel(true,  11, 1, 0);
    const ai2 = humanIsP1 ? wasm.createAIWithLevel(false, 11, 1, 0) : null;

    const moveLog = buildInitialMoveLogFromPuzzle(p);

    // Map to app's modes:
    // - human_first  => human=P1, AI=P2 (AI acts when currentPlayer===1)
    // - ai_first     => AI=P1, human=P2 (AI acts when currentPlayer===0)
    const mode = humanIsP1 ? "human_first" : "ai_first";

    // IMPORTANT: set mode + currentPlayer via INIT_GAME
    const currentPlayerIdx = (playerToMove === 1 ? 0 : 1);
    const preMoves = countPreMovesFromPuzzle(p);
    // console.log("preMoves",preMoves)

    dispatch({
      type: "INIT_GAME",
      payload: {
        board, ai1, ai2, grid, marker: board.marker, validMoves,
        mode: mode,
        currentPlayer: currentPlayerIdx,
        moveLog,
        round: preMoves,
      }
    });
    dispatch({ type: "UPDATE_STATE" });     // sync derived state
    dispatch({ type: "PROBLEM_START", payload: p });

    if (typeof closeSidebarIfMobile === "function") closeSidebarIfMobile();
  }



  function resetProblem() {
    const { wasm, problem } = state;
    if (!wasm || !problem?.current) return;
    setPuzzleDialogOpen(false);

    const p = problem.current;
    const board = new wasm.Board(p.rows, p.cols);

    applyPuzzleToEngine(p, board);

    const blocked = countBlocked(board);
    const playerToMove = whoMovesFromParity(blocked);
    board.setCurrentPlayerInt(playerToMove);

    const humanIsP1 = (playerToMove === 1);
    const ai1 = humanIsP1 ? null : wasm.createAIWithLevel(true,  state.maxDepth, state.difficulty, 0);
    const ai2 = humanIsP1 ? wasm.createAIWithLevel(false, state.maxDepth, state.difficulty, 0) : null;

    const moveLog = buildInitialMoveLogFromPuzzle(p);

    const mode = humanIsP1 ? "human_first" : "ai_first";
    const currentPlayerIdx = (playerToMove === 1 ? 0 : 1);
    const preMoves = countPreMovesFromPuzzle(p);
    // console.log("preMoves",preMoves)

    dispatch({
      type: "INIT_GAME",
      payload: {
        board, ai1, ai2, grid, marker: board.marker, validMoves,
        mode: mode,
        currentPlayer: currentPlayerIdx,
        moveLog,
        round: preMoves,
      }
    });
    dispatch({ type: "UPDATE_STATE" });
    dispatch({ type: "PROBLEM_RESET" });
  }



  // After each human move in Problem mode, evaluate success / limit
  function evaluateProblemAfterMove(nextMovesMade) {
    if (state.problem?.status !== "active" || !state.problem?.current) return;
    const p = state.problem.current;

    // win check (engine terminal)
    if (state.board.isTerminal()) {
      dispatch({ type: "PROBLEM_SET_STATUS", payload: "success" });
    } 
    // else if (p.movesLimit && nextMovesMade > p.movesLimit) {
    //   dispatch({ type: "PROBLEM_SET_STATUS", payload: "failed" });
    // }
  }
  //END NEW

  // Turns a flat list of moves into [[p1, p2], [p1, p2], ...]
  function pairMoves(moves) {
    const rounds = [];
    for (let i = 0; i < moves.length; i++) {
      const r = Math.floor(i / 2);
      if (!rounds[r]) rounds[r] = [null, null];
      const side = (i % 2 === 0) ? 0 : 1; // P1 then P2
      rounds[r][side] = moves[i];
    }
    return rounds;
  }

  function countPreMovesFromPuzzle(p) {
    // Defensive: ignore if someone accidentally put the marker in 'blocked'
    const [mr, mc] = p.marker;
    return (p.blocked || []).filter(([r, c]) => !(r === mr && c === mc)).length;
  }


  // Build initial log from puzzle JSON (blocked is in move order)
  function buildInitialMoveLogFromPuzzle(p) {
    // defensive: ensure marker is NOT treated as blocked
    const blocked = (p.blocked || []).filter(([r, c]) => !(r === p.marker[0] && c === p.marker[1]));

    if (blocked.length === 0) return [];           // no past moves

    // Destination squares your UI logs:
    // [ blocked[1], blocked[2], ..., blocked[last], marker ]
    const dests = blocked.slice(1);
    dests.push([p.marker[0], p.marker[1]]);

    return pairMoves(dests);
  }


  function onAiMoveClick() {
    // Só avisar em modos contra IA
    const vsAI = state.mode === "human_first" || state.mode === "ai_first";
    if (!vsAI) {
      handleAiTurn(true);
      return;
    }

    // Se o utilizador marcou "não mostrar novamente"
    const warnDisabled = localStorage.getItem("aiMoveWarnDisabled") === "1";
    if (warnDisabled) {
      dispatch({ type: "SKIP_STATS_THIS_MATCH" });
      handleAiTurn(true);
      return;
    }

    setAiMoveWarnOpen(true);
  }


  return (
    <div className="app">
      
      <header className="rb-header">
        <button
          className="rb-burger"
          aria-label="Abrir opções"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen(true)}
        >
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="var(--text)">
        <rect x="3" y="5" width="18" height="2" rx="1"></rect>
        <rect x="3" y="11" width="18" height="2" rx="1"></rect>
        <rect x="3" y="17" width="18" height="2" rx="1"></rect>
      </svg>
        </button>
        <h1 style={{ margin: 10 }}>Rastros</h1>
      </header>

      {/* Collapsible sidebar with dummy items */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} width={300}>
        <h2 style={{ marginTop: 0,color:"black" }}>Configurações</h2>
        <div style={{ display: "grid", gap: 10 }}>



          <div className="selectors" >

            <ModeSelector
              value={mode}
              onSelect={(m) => dispatch({ type: "SET_MODE", payload: m })}
              disabled={state.gameStarted}
            />
            <GridSizeSelector
              rows={state.rows}
              cols={state.cols}
              onSelect={(dims) => dispatch({ type: "SET_DIMENSIONS", payload: dims })}
              disabled={state.gameStarted}

            />

            <DifficultySelector
              value={state.difficulty}
              onChange={handleDificultySelector}
              disabled={state.gameStarted}
            />

          </div>
          <button onClick={handleHistoryclick} style={{ marginTop: 8 }}>
              Ver estatísticas
           </button>

          <button
             className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm hover:bg-gray-50"
             onClick={() => setRulesOpen(true)}
           >
             Regras do Jogo
           </button>

{/*          <button onClick={() => alert("Ação de demonstração")}>Aplicar</button>
          <button onClick={() => setSidebarOpen(false)}>Fechar</button>*/}
           
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: "black" }}>
              <input
                type="checkbox"
                checked={soundOn}
                onChange={(e) => {
                  const on = e.target.checked;
                  setSoundOn(on);
                  // console.log("Sound toggled:", on);
                  // optional: tiny feedback when turning ON
                  
                }}
              />
              Som
            </label>
          <div>

            <div style={{ fontSize: 12, color: "#666" }}>Tema</div>
            <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                style={{ width: "100%" }}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>
        </div>


        <hr style={{ margin: "12px 0" }} />
        <div>
          <div style={{ fontSize: 12, color: "#666" }}>Problemas</div>
          <button onClick={startRandomProblem} style={{ marginTop: 8 }}>
            Novo problema aleatório
          </button>

          {state.problem?.current && (
            <>
              <button onClick={resetProblem} style={{ marginTop: 8 }}>
                Reiniciar problema
              </button>
              <div style={{ marginTop: 6, fontSize: 12, color: "#333" }}>
                Estado: <strong>{state.problem?.status ?? "idle"}</strong>
                <br />
                Movimentos:{" "}
                <strong>
                  {state.problem?.movesMade ?? 0}
                  {state.problem?.current?.movesLimit
                    ? ` / ${state.problem.current.movesLimit}`
                    : ""}
                </strong>
              </div>
            </>
          )}
        </div>


      </Sidebar>

    
    <div className="buttons">

{/*    {state.gameStarted &&(
        <button onClick={() => handleAiTurn(true)} disabled= {isAiTurn()}> Fazer jogada IA</button>
        )}
*/}
    {state.gameStarted && !state.problem?.current &&(
        <button onClick={onAiMoveClick} disabled={isAiTurn()}>
          Fazer jogada IA
        </button>
    )}

    {!state.gameStarted && (

      <button
        className="start-btn"
        onClick={handleStartGame}
      >
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

      {state.problem?.current &&(
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

        {winner && !state.problem?.current &&(



        <div className="winner-message">
          {winner <=2 &&(
          <h2>Vitória do Jogador {winner}!</h2>
          ) }
          {winner >2 &&(
          <h2>Jogador bloqueado!<br />
           Vitória do Jogador {winner/3}!</h2>
          ) }
          <button onClick={handleDownloadLog}> Baixar registo do jogo</button>
          <button onClick={() => dispatch({ type: "SET_WINNER", payload: null  })}>Voltar</button>{/*type: "RESET_GAME"*/}
        </div>
      )}

      {puzzleDialogOpen && state.problem?.current && (

        <div className="winner-message">
          {(() => {
            const p = state.problem.current;
            const used = state.problem.movesMade ?? 0; // your human moves in this puzzle
            const best = getBestMovesForPuzzle(p);
            const optimal = typeof best === "number" && used === best;

            if (state.problem.status === "failed") {
              return (
                <>
                  <h2>Não conseguiste resolver este problema</h2>
                  <p>
                    {typeof best === "number"
                      ? <>Solução mínima: <strong>{best}</strong> jogadas.</>
                      : <>Tenta novamente.</>}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent:"center" }}>
                    <button onClick={() => setPuzzleDialogOpen(false)}>Fechar</button>
                    <button onClick={() => { setPuzzleDialogOpen(false); resetProblem(); }}>
                      Tentar de novo
                    </button>
                  </div>
                </>
              );
            }

            if (optimal) {
              return (
                <>
                  <h2>Parabéns! Solução ótima.</h2>
                  <p>Conseguiste em <strong>{used}</strong> jogadas, que é o mínimo.</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent:"center"  }}>
                    <button onClick={() => setPuzzleDialogOpen(false)}>Fechar</button>
                    <button onClick={() => { setPuzzleDialogOpen(false); startRandomProblem(); }}>
                      Outro problema
                    </button>
                  </div>
                </>
              );
            }

            return (
              <>
                <h2>Solução não ótima!</h2>
                <p>
                  Usaste <strong>{used}</strong> jogadas.
                  {typeof best === "number" ? <> Melhor solução: <strong>{best}</strong>.</> : null}
                </p>
                <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent:"center"  }}>
                  <button onClick={() => setPuzzleDialogOpen(false)}>Fechar</button>
                  <button onClick={() => { setPuzzleDialogOpen(false); resetProblem(); }}>
                    Tentar de novo
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}



    {aiMoveWarnOpen && (
      <div className="winner-message" role="dialog" aria-modal="true">
        <h2>Aviso</h2>
        <p>
          Se prosseguir, este jogo <strong>não</strong> será contabilizado nas
          estatísticas do histórico.
        </p>
        <label style={{ display: "flex", gap: 8, alignItems: "center", justifyContent:"center", marginTop: 8 }}>
          <input
            type="checkbox"
            checked={aiMoveDontWarnAgain}
            onChange={(e) => setAiMoveDontWarnAgain(e.target.checked)}
          />
          Não mostrar este aviso novamente
        </label>
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent:"center" }}>
          <button onClick={() => setAiMoveWarnOpen(false)}>Cancelar</button>
          <button
            onClick={() => {
              if (aiMoveDontWarnAgain) {
                localStorage.setItem("aiMoveWarnDisabled", "1");
              }
              dispatch({ type: "SKIP_STATS_THIS_MATCH" });
              setAiMoveWarnOpen(false);
              handleAiTurn(true);
            }}
          >
            Prosseguir
          </button>
        </div>
      </div>
    )}




    </div>
    <WinHistoryDialog open={showHistory} onClose={() => setShowHistory(false)} />
    <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />

    </div>

  );
}



export default App;