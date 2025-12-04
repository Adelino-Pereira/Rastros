// src/components/Board.test.jsx
import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Board from "../Board";

describe("Board component", () => {
  const grid = [
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ];
  const marker = [1, 1]; // middle
  const validMoves = [
    [0, 0],
    [2, 2],
  ];

  test("escreve coordenadas ao longo do tabuleiro", () => {
    const { container } = render(
      <Board
        grid={grid}
        marker={marker}
        validMoves={validMoves}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );

    const labels = Array.from(container.querySelectorAll(".cell-label")).map(
      (n) => n.textContent
    );

    // expect bottom column labels a, b, c to exist
    expect(labels).toEqual(expect.arrayContaining(["a", "b", "c"]));

    // expect row numbers 1..rows to exist
    expect(labels).toEqual(expect.arrayContaining(["1", "2", "3"]));
  });

  test("desenha o marcador", () => {
    const { container } = render(
      <Board
        grid={grid}
        marker={marker}
        validMoves={validMoves}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    expect(container.querySelector(".marker-circle")).toBeTruthy();
  });

  test("chama onCellClick no click de numa casa válida", async () => {
    const user = userEvent.setup();
    const onCellClick = vi.fn();

    const { container } = render(
      <Board
        grid={grid}
        marker={marker}
        validMoves={validMoves}
        onCellClick={onCellClick}
        gameStarted={true}
      />
    );

    const cells = container.querySelectorAll(".cell");
    const rows = grid.length;
    const cols = grid[0].length;

    // helper to map (r,c) -> flat index in NodeList
    const idx = (r, c) => r * cols + c;

    // click a known valid move: (0,0)
    await user.click(cells[idx(0, 0)]);

    expect(onCellClick).toHaveBeenCalledWith(0, 0);
  });

  // Add these to src/components/Board.test.jsx

  test('adiciona class "blocked" a casas com valor 0', () => {
    const grid = [
      [1, 1, 1],
      [1, 0, 1], // (1,1) is blocked but we’ll put marker elsewhere
      [1, 1, 1],
    ];
    const marker = [0, 2];
    const { container } = render(
      <Board
        grid={grid}
        marker={marker}
        validMoves={[]}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    const cells = container.querySelectorAll(".cell");
    const cols = grid[0].length;
    const idx = (r, c) => r * cols + c;

    expect(cells[idx(1, 1)].classList.contains("blocked")).toBe(true);
  });

  test('adiciona class "valid" para casas na lista validMoves', () => {
    const grid = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ];
    const validMoves = [
      [0, 0],
      [2, 2],
    ];
    const { container } = render(
      <Board
        grid={grid}
        marker={[1, 1]}
        validMoves={validMoves}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    const cells = container.querySelectorAll(".cell");
    const cols = grid[0].length;
    const idx = (r, c) => r * cols + c;

    expect(cells[idx(0, 0)].classList.contains("valid")).toBe(true);
    expect(cells[idx(2, 2)].classList.contains("valid")).toBe(true);
  });

  test("quando gameStarted=false, tabuleiro está inativo (pointer-events none, opacity 0.5)", () => {
    const grid = [
      [1, 1],
      [1, 1],
    ];
    const { container } = render(
      <Board
        grid={grid}
        marker={[0, 0]}
        validMoves={[[0, 1]]}
        onCellClick={() => {}}
        gameStarted={false}
      />
    );
    const wrapper = container.querySelector(".board-wrapper");
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.pointerEvents).toBe("none");
    expect(wrapper.style.opacity).toBe("0.5");
  });

  test("esconde a numeração nos objetivos (1 e 2) quando se alcança o objetivo", () => {
    const grid = [
      [1, 1, 1], // linha superior → P2 objetivo (0, cols-1) = (0,2)
      [1, 1, 1],
      [1, 1, 1], // bottom row → P1 objetivo (rows-1, 0) = (2,0)
    ]; // tabuleiro exemplo minimal 3x3 para testar cantos

    // Caso A: não alcança
    let { container, rerender } = render(
      <Board
        grid={grid}
        marker={[1, 1]}
        validMoves={[]}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    const labelsA = Array.from(container.querySelectorAll(".goal-label")).map(
      (n) => n.textContent
    );
    expect(labelsA).toEqual(expect.arrayContaining(["1", "2"]));

    // Caso B: P1 alcança (marker em (2,0)) ⇒ label "1" hidden
    rerender(
      <Board
        grid={grid}
        marker={[2, 0]}
        validMoves={[]}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    const labelsB = Array.from(container.querySelectorAll(".goal-label")).map(
      (n) => n.textContent
    );
    expect(labelsB).not.toEqual(expect.arrayContaining(["1"])); // 1 visivel
    expect(labelsB).toEqual(expect.arrayContaining(["2"])); // 2 escondida

    // Caso C: P2 alcança (marker em (0,2)) ⇒ label "2" hidden
    rerender(
      <Board
        grid={grid}
        marker={[0, 2]}
        validMoves={[]}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    const labelsC = Array.from(container.querySelectorAll(".goal-label")).map(
      (n) => n.textContent
    );
    expect(labelsC).toEqual(expect.arrayContaining(["1"])); // 1 visivel
    expect(labelsC).not.toEqual(expect.arrayContaining(["2"])); // 2 escondida
  });

  test("desenha exatamente um marcador", () => {
    const grid = [
      [1, 1],
      [1, 1],
    ];
    const { container } = render(
      <Board
        grid={grid}
        marker={[0, 1]}
        validMoves={[]}
        onCellClick={() => {}}
        gameStarted={true}
      />
    );
    expect(container.querySelectorAll(".marker-circle")).toHaveLength(1);
  });

  // helper para grid com 1's
  const makeGrid = (rows, cols) =>
    Array.from({ length: rows }, () => Array(cols).fill(1));

  describe("Desenha tabuleiro", () => {
    const sizes = Array.from({ length: 11 - 5 + 1 }, (_, i) => 5 + i); // rows/columns de 5 a 11

    for (const rows of sizes) {
      for (const cols of sizes) {
        test(`${rows}x${cols}`, () => {
          const grid = makeGrid(rows, cols);
          const marker = [Math.floor(rows / 2), Math.floor(cols / 2)]; // qualquer marcador válido
          const { container } = render(
            <Board
              grid={grid}
              marker={marker}
              validMoves={[]}
              onCellClick={() => {}}
              gameStarted={true}
            />
          );
          const cells = container.querySelectorAll(".cell");
          expect(cells.length).toBe(rows * cols);
        });
      }
    }
  });
});
