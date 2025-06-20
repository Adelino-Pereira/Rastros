import React, { useEffect, useReducer } from "react";
import "./App.css";
import ModeSelector from "./components/ModeSelector";
import GridSizeSelector from "./components/GridSizeSelector";
import Board from "./components/Board";
import MoveLog from "./components/MoveLog";
import DifficultySelector from "./components/DifficultySelector";
import { initWasm } from "./wasm/gameAPI";
import { gameReducer, initialState } from "./state/gameReducer";
import { getFirstMoveAI } from "./utils/getFirstMoveAI";
import { generateLogText } from "./utils/generateLogText";

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Carregar WASM e fazer reset do jogo quando carregado
  useEffect(() => {
    initWasm().then((Module) => {
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
    const { wasm, size, mode, startDepth, maxDepth } = state;
    if (!wasm) return;

    const board = new wasm.Board(state.rows, state.cols)

    const ai1 = new wasm.AI(true, maxDepth);
    const ai2 = new wasm.AI(false, maxDepth);

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
    dispatch({ type: "APPLY_MOVE", payload: { move: [r, c] } });
    dispatch({ type: "UPDATE_STATE" });
    dispatch({ type: "INCREMENT_ROUND" });


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
    } else {
      dispatch({ type: "END_TURN" }); // triggers useEffect below
    }

  };

  //jogada IA
  const handleAiTurn = () => {
    const { board, ai1, ai2, currentPlayer, round, size, startDepth, maxDepth } = state;
    const ai = currentPlayer === 0 ? ai1 : ai2;

    let move;
    let depth;
    
    const cond1 = (state.rows >= 9 || state.cols>= 9) && state.mode == "ai_vs_ai";
    const cond2 = state.rows >= 10 || state.cols>= 10 && state.mode


    if (cond1 || cond2) {
      depth = 7;
    }else{
      // if(state.rows==7 && state.cols== 7){
      //   state.startDepth = 11;
      //   state.maxDepth = 20;

      // }
      depth = Math.min(startDepth + Math.floor(round / 5), maxDepth);
    }
      console.log(` AI ${currentPlayer} searching with depth ${depth}`);
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

    const { board, currentPlayer, mode } = state;

    const shouldAIPlay =
      (mode === "human_first" && currentPlayer === 1) ||
      (mode === "ai_first" && currentPlayer === 0) ||
      (mode === "ai_vs_ai");

    if (shouldAIPlay) {
      setTimeout(() => handleAiTurn(), 100);
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
    link.download = `${state.mode}_${state.rows}x${state.cols}_d-${state.difficulty}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };



 // log de estados em cada carregamento
  // useEffect(() => {
  //   console.log("[App] Full state updated:", state);
  // }, [state]);




  return (
    <div className="app">
      <h1>Rastros</h1>


      <div className="selectors">

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
          onChange={(val) => dispatch({ type: "SET_DIFFICULTY", payload: val })}
          disabled={state.gameStarted}
        />

      </div>
    
    <div className="buttons">

    {state.gameStarted &&(
        <button onClick={handleAiTurn} disabled= {isAiTurn()}> Fazer jogada AI</button>
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

          {winner && (
        <div className="winner-message">
          {winner <=2 &&(
          <h2>Vitória do Jogador {winner}!</h2>
          ) }
          {winner >2 &&(
          <h2>Jogador bloqueado!<br />
           Vitória do Jogador {winner/3}!</h2>
          ) }
          <button onClick={handleDownloadLog}> Baixar registo do jogo</button>
          <button onClick={() => dispatch({ type: "SET_WINNER", payload: null })}>Voltar</button>
        </div>
      )}
    </div>

    </div>
  );
}

export default App;