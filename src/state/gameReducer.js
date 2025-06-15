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
  startDepth: 10,
  maxDepth: 20,
  difficulty: 5, // default


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
      return {
        ...state,
        board: action.payload.board,
        ai1: action.payload.ai1,
        ai2: action.payload.ai2,
        grid: action.payload.grid,
        marker: action.payload.marker,
        validMoves: action.payload.validMoves,
        moveLog: [],
        currentPlayer: 0,
        winner: null,
        round: 0,
        gameStarted: true,
        isTurnEnded: false,
        resetKey: state.resetKey + 1,
      };
    case "RESET_GAME": {
      const { wasm, size } = state;
      if (!wasm) return state;

      const board = new wasm.Board(state.rows, state.cols)

      const ai1 = new wasm.AI(true, 11);
      const ai2 = new wasm.AI(false, 11);

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

        default:
          return state;
      }
    }
