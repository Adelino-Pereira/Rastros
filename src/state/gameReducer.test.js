import { describe, it, expect, vi } from "vitest";
import { gameReducer, initialState } from "./gameReducer";

// Mock sound + converters to evitar efeitos colaterais
vi.mock("../utils/soundManager", () => ({
  default: {
    play: vi.fn(),
    attachAutoUnlock: vi.fn(),
    preload: vi.fn(),
    setMuted: vi.fn(),
  },
}));

vi.mock("../utils/wasmConverters", () => ({
  convertGrid: (_flat, _r, _c) => "grid-converted",
  convertMarker: (_m) => "marker-converted",
  convertValidMoves: (_m) => "moves-converted",
}));

// Helpers
const makeBoard = () => ({
  getFlatGrid: () => [1, 1],
  getRows: () => 1,
  getCols: () => 2,
  getFlatValidMoves: () => [0, 1, 0, 2],
  getValidMoves: () => [],
  getMarker: () => [0, 0],
});

const makeWasm = () => ({
  Board: function Board(_rows, _cols) {
    return makeBoard();
  },
  AI: function AI() {
    return {};
  },
});

describe("gameReducer", () => {
  it("SET_WASM atualiza wasm", () => {
    const wasm = {};
    const next = gameReducer(initialState, { type: "SET_WASM", payload: wasm });
    expect(next.wasm).toBe(wasm);
  });

  it("INIT_GAME inicia jogo com payload dado", () => {
    const payload = {
      board: "b",
      ai1: "a1",
      ai2: "a2",
      grid: [[1]],
      marker: [0, 0],
      validMoves: [[0, 0]],
      mode: "ai_first",
      currentPlayer: 1,
      moveLog: [[1, 2]],
      round: 3,
    };
    const next = gameReducer(initialState, { type: "INIT_GAME", payload });
    expect(next.board).toBe("b");
    expect(next.ai1).toBe("a1");
    expect(next.grid).toEqual([[1]]);
    expect(next.gameStarted).toBe(true);
    expect(next.currentPlayer).toBe(1);
    expect(next.round).toBe(3);
    expect(next.resetKey).toBe(initialState.resetKey + 1);
  });

  it("RESET_GAME cria novo board/ais e limpa estado", () => {
    const state = { ...initialState, wasm: makeWasm(), rows: 1, cols: 2 };
    const next = gameReducer(state, { type: "RESET_GAME" });
    expect(next.board).toBeDefined();
    expect(next.ai1).toBeDefined();
    expect(next.grid).toBe("grid-converted");
    expect(next.marker).toBe("marker-converted");
    expect(next.validMoves).toBe("moves-converted");
    expect(next.moveLog).toEqual([]);
    expect(next.problem.status).toBe("idle");
  });

  it("APPLY_MOVE acrescenta movimento no log", () => {
    const state = { ...initialState, moveLog: [], currentPlayer: 0 };
    const next = gameReducer(state, {
      type: "APPLY_MOVE",
      payload: { move: [1, 1] },
    });
    expect(next.moveLog).toEqual([[[1, 1], null]]);
  });

  it("END_TURN / SWITCH_PLAYER / INCREMENT_ROUND atualizam flags", () => {
    const end = gameReducer(initialState, { type: "END_TURN" });
    expect(end.isTurnEnded).toBe(true);

    const switched = gameReducer(end, { type: "SWITCH_PLAYER" });
    expect(switched.currentPlayer).toBe(1);
    expect(switched.isTurnEnded).toBe(false);

    const increment = gameReducer(end, { type: "INCREMENT_ROUND" });
    expect(increment.round).toBe(initialState.round + 1);
  });

  it("SET_WINNER termina jogo e regista vencedor", () => {
    const next = gameReducer(initialState, {
      type: "SET_WINNER",
      payload: 2,
    });
    expect(next.winner).toBe(2);
    expect(next.gameStarted).toBe(false);
  });

  it("ações de problema alteram estado de puzzle", () => {
    const prob = { marker: [0, 0] };
    const started = gameReducer(initialState, {
      type: "PROBLEM_START",
      payload: prob,
    });
    expect(started.problem.status).toBe("active");
    expect(started.problem.current).toBe(prob);

    const moved = gameReducer(started, { type: "PROBLEM_MOVE" });
    expect(moved.problem.movesMade).toBe(1);

    const status = gameReducer(moved, {
      type: "PROBLEM_SET_STATUS",
      payload: "success",
    });
    expect(status.problem.status).toBe("success");

    const reset = gameReducer(status, { type: "PROBLEM_RESET" });
    expect(reset.problem.status).toBe("active");
    expect(reset.problem.movesMade).toBe(0);

    const cleared = gameReducer(reset, { type: "PROBLEM_CLEAR" });
    expect(cleared.problem.current).toBe(null);
    expect(cleared.problem.status).toBe("idle");
  });

  it("SKIP_STATS_THIS_MATCH ativa flag", () => {
    const next = gameReducer(initialState, { type: "SKIP_STATS_THIS_MATCH" });
    expect(next.skipStatsThisMatch).toBe(true);
  });
});
