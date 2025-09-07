import Sound from "../utils/soundManager";

export const initialState = {
  wasm: null,
  board: null,
  ai1: null,
  ai2: null,
  grid: [],
  marker: null,
  validMoves: [],
  moveLog: [],
  currentPlayer: 0,
  mode: "human_first",  // default 
  rows: 7, // default
  cols: 7, // default
  winner: null,
  resetKey: 0,
  gameStarted: false,   
  isTurnEnded: false,
  round: 0, 
  startDepth: 9,
  maxDepth: 17,
  difficulty: 5, // default
  skipStatsThisMatch: false, // não contar este jogo nas estatísticas se true

  problem: { current: null, movesMade: 0, status: "idle" } // NEW
};


function extractGrid(board) {
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
  return grid;
}

function extractValidMoves(board) {
  const rawMoves = board.getValidMoves();
  const parsedMoves = [];
  for (let i = 0; i < rawMoves.size(); i++) {
    const move = rawMoves.get(i);
    parsedMoves.push([move.get(0), move.get(1)]);
  }
  return parsedMoves;
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "SET_WASM":
      return { ...state, wasm: action.payload };

    case "SET_MODE":
      return { ...state, mode: action.payload };

    case "SET_SIZE":
      return { ...state, size: action.payload };

    case "SET_DIMENSIONS":
      Sound.play("slide");
      return {
        ...state,
        rows: action.payload.rows,
        cols: action.payload.cols,
      };

    case "START_GAME":
      return {
        ...state,
        gameStarted: true,
      };
    case "INIT_GAME":
        const { board, ai1, ai2, grid, marker, validMoves, mode, currentPlayer, moveLog,round } = action.payload;
        //console.log("round",round);
        return {
        ...state,
        board: action.payload.board,
        ai1: action.payload.ai1,
        ai2: action.payload.ai2,
        grid: action.payload.grid,
        marker: action.payload.marker,
        validMoves: action.payload.validMoves,
        //moveLog: [],
        moveLog: Array.isArray(moveLog) ? moveLog : [],
        //currentPlayer: 0,
        currentPlayer: (typeof currentPlayer === "number" ? currentPlayer : 0),
        winner: null,
        //round: 0,
        round:  round > 0 ? round : 0,
        mode: mode ?? state.mode,
        gameStarted: true,
        isTurnEnded: false,
        resetKey: state.resetKey + 1,
        skipStatsThisMatch: false,
      };
    case "RESET_GAME": {
      const { wasm, size } = state;
      if (!wasm) return state;

      const board = new wasm.Board(state.rows, state.cols)

      const ai1 = new wasm.AI(true, 11);
      const ai2 = new wasm.AI(false, 11);
      Sound.play("button");

      return {
        ...state,
        board,
        ai1,
        ai2,
        grid: extractGrid(board),
        marker: board.marker,
        validMoves: extractValidMoves(board),
        moveLog: [],
        currentPlayer: 0,
        winner: null,
        resetKey: state.resetKey + 1,
        gameStarted:false,
        problem: { current: null, movesMade: 0, status: "idle" },
        skipStatsThisMatch: false,
      };
    }

    case "UPDATE_STATE": {
      const { board } = state;
      return {
        ...state,
        grid: extractGrid(board),
        marker: board.marker,
        validMoves: extractValidMoves(board),
      };
    }

    case "APPLY_MOVE": {
      const { move } = action.payload;
      const newLog = [...state.moveLog];
      if (state.currentPlayer === 0) newLog.push([move, null]);
      else if (newLog.length > 0) newLog[newLog.length - 1][1] = move;

      return {
        ...state,
        moveLog: newLog,
      };
    }

    case "SET_DIFFICULTY":
      return {
        ...state,
        difficulty: action.payload,
      };

    case "END_TURN":
      return { ...state, isTurnEnded: true };

    case "SWITCH_PLAYER":
      return {
        ...state,
        currentPlayer: 1 - state.currentPlayer,
        isTurnEnded: false, // reset
      };

    case "SET_WINNER":
      return {
        ...state,
        winner: action.payload,
      };

    case "INCREMENT_ROUND":
      return { ...state, round: state.round + 1 };

// NEW PROBLEM-RELATED ACTIONS
    case "PROBLEM_START": {
      return {
        ...state,
        //mode: "problem",
        gameStarted: true,
        winner: null,
        //round: 0,
        problem: {
          current: action.payload,      // the puzzle object
          movesMade: 0,
          status: "active"
        }
      };
    }
    case "PROBLEM_MOVE": {
      const prev = state.problem?.movesMade ?? 0;
      return { ...state, problem: { ...state.problem, movesMade: prev + 1 } };
    }
    case "PROBLEM_SET_STATUS": {
      return { ...state, problem: { ...state.problem, status: action.payload } };
    }
    case "PROBLEM_RESET": {
      if (!state.problem?.current) return state;
      return {
        ...state,
        winner: null,
        round: 0,
        problem: { ...state.problem, movesMade: 0, status: "active" }
      };
    }
    case "PROBLEM_CLEAR": {
      return {
        ...state,
        problem: { current: null, movesMade: 0, status: "idle" }
      };
    }
    // (optional but recommended) clear problem when doing a full RESET_GAME
    // case "RESET_GAME": {
    //   const next = /* your existing reset object */;
    //   next.problem = { current: null, movesMade: 0, status: "idle" };
    //   return next;
    // }


    case "SKIP_STATS_THIS_MATCH":
      return { ...state, skipStatsThisMatch: true };
// END NEW

    default:
      return state;
  }
}
