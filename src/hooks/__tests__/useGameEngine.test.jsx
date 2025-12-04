import React, { useEffect, useRef } from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useGameEngine } from "../useGameEngine";

// Silencia sons durante testes
vi.mock("../../utils/soundManager", () => ({
  default: {
    attachAutoUnlock: vi.fn(),
    preload: vi.fn(),
    play: vi.fn(),
    setMuted: vi.fn(),
  },
}));

// Fake WASM Board/AI mínimos para exercitar o hook
class FakeBoard {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.marker = [0, 0];
    this._grid = Array.from({ length: rows }, () => Array(cols).fill(1));
    this._valid = [
      [0, 0],
      [0, 1],
    ];
    this._terminal = false;
    this._winner = null;
  }
  getFlatGrid() {
    return this._grid.flat();
  }
  getFlatValidMoves() {
    return this._valid.flat();
  }
  getValidMoves() {
    const self = this;
    return {
      size: () => self._valid.length,
      get: (i) => ({
        get: (j) => (j === 0 ? self._valid[i][0] : self._valid[i][1]),
      }),
    };
  }
  makeMove(move) {
    this.marker = move;
  }
  isTerminal() {
    return this._terminal;
  }
  getWinner() {
    return this._winner;
  }
  switchPlayer() {}
  setCurrentPlayerInt() {}
  getMarker() {
    const [r, c] = this.marker;
    return { get: (i) => (i === 0 ? r : c), first: r, second: c };
  }
}

const fakeAI = {
  setOrderingPolicy: vi.fn(),
  setShuffleTiesOnly: vi.fn(),
  chooseMove: vi.fn().mockReturnValue([0, 0]),
};

const fakeWasm = {
  Board: FakeBoard,
  createAIWithLevel: () => fakeAI,
};

function createEngine(renderState, dispatch, uiRefs) {
  const ref = { current: null };
  function Wrapper() {
    const engine = useGameEngine(renderState, dispatch, uiRefs);
    const engineRef = useRef(engine);
    engineRef.current = engine;
    useEffect(() => {
      ref.current = engineRef.current;
    }, [engine]);
    return null;
  }
  render(<Wrapper />);
  return ref;
}

describe("useGameEngine", () => {
  const baseState = {
    wasm: fakeWasm,
    rows: 7,
    cols: 7,
    maxDepth: 3,
    difficulty: 2,
    problem: { status: "idle", current: null },
  };

  const uiRefs = {
    setPuzzleDialogOpen: vi.fn(),
    setAiMoveWarnOpen: vi.fn(),
    aiMoveDontWarnAgain: false,
    setAiMoveDontWarnAgain: vi.fn(),
    closeSidebarIfMobile: vi.fn(),
  };

  it("inicia jogo e despacha INIT_GAME com grid e marker", () => {
    const actions = [];
    const dispatch = vi.fn((a) => actions.push(a));

    const ref = createEngine(baseState, dispatch, uiRefs);
    ref.current.handleStartGame();

    const init = actions.find((a) => a.type === "INIT_GAME");
    expect(init).toBeTruthy();
    expect(init.payload.grid.length).toBe(7);
    expect(init.payload.grid[0].length).toBe(7);
    expect(init.payload.marker).toEqual([0, 0]);
    expect(uiRefs.setPuzzleDialogOpen).toHaveBeenCalledWith(false);
  });

  it("aplica jogada humana e despacha APPLY_MOVE", () => {
    const board = new FakeBoard(7, 7);
    const actions = [];
    const dispatch = vi.fn((a) => actions.push(a));

    const ref = createEngine(
      {
        ...baseState,
        board,
        validMoves: [
          [0, 0],
          [0, 1],
        ],
        gameStarted: true,
        winner: null,
        mode: "human_vs_human",
        currentPlayer: 0,
        round: 0,
        startDepth: 1,
      },
      dispatch,
      uiRefs
    );

    ref.current.handleCellClick(0, 0);
    expect(actions.find((a) => a.type === "APPLY_MOVE")).toBeTruthy();
  });
});
