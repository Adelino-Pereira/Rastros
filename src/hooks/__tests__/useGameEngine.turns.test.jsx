import React, { useEffect, useRef } from "react";
import { render, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useGameEngine } from "../useGameEngine";

// Silence sounds
vi.mock("../../utils/soundManager", () => ({
  default: {
    attachAutoUnlock: vi.fn(),
    preload: vi.fn(),
    play: vi.fn(),
    setMuted: vi.fn(),
  },
}));

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
    ref.current = engine;
    return null;
  }
  render(<Wrapper />);
  return ref;
}

describe("useGameEngine turn logic", () => {
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

  it("isAiTurn matches mode/human/ai positions", () => {
    const dispatch = vi.fn();
    const refHumanFirst = createEngine(
      {
        ...baseState,
        mode: "human_first",
        currentPlayer: 0,
      },
      dispatch,
      uiRefs
    );

    expect(refHumanFirst.current.isAiTurn()).toBe(false); // human starts

    const refAiFirst = createEngine(
      {
        ...baseState,
        mode: "ai_first",
        currentPlayer: 0,
      },
      dispatch,
      uiRefs
    );
    expect(refAiFirst.current.isAiTurn()).toBe(true);
  });

  it("handleAiTurn dispatches APPLY_MOVE and END_TURN flow", () => {
    vi.useFakeTimers();
    const actions = [];
    const dispatch = vi.fn((a) => actions.push(a));
    const board = new FakeBoard(7, 7);

    const ref = createEngine(
      {
        ...baseState,
        board,
        ai1: fakeAI,
        ai2: fakeAI,
        validMoves: board.getFlatValidMoves(),
        gameStarted: true,
        winner: null,
        mode: "ai_first",
        currentPlayer: 0,
        round: 0,
        startDepth: 1,
      },
      dispatch,
      uiRefs
    );

    act(() => {
      ref.current.handleAiTurn();
      vi.runAllTimers();
    });

    const types = actions.map((a) => a.type);
    expect(types).toContain("APPLY_MOVE");
    expect(types).toContain("UPDATE_STATE");
    expect(types).toContain("INCREMENT_ROUND");
    expect(types).toContain("END_TURN");
    vi.useRealTimers();
  });
});
