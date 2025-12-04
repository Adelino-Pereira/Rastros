import React from "react";
import { render, screen, within } from "@testing-library/react";
import MoveLog from "../MoveLog";

describe("MoveLog", () => {
  const makeLog = (rounds) => {
    // cada item é [moveP1, moveP2], onde move = [row, col]
    return Array.from({ length: rounds }, (_, i) => [
      [i, 0], // P1 joga sempre na coluna a (col=0)
      [i, 1], // P2 joga sempre na coluna b (col=1)
    ]);
  };

  test("renderiza cabeçalhos e numeração das rondas", () => {
    render(
      <MoveLog log={makeLog(3)} currentPlayer={0} gridSize={7} resetKey={0} />
    );
    expect(screen.getByText("Ronda")).toBeInTheDocument();
    expect(screen.getByText("Jogador 1")).toBeInTheDocument();
    expect(screen.getByText("Jogador 2")).toBeInTheDocument();

    // Rondas 1..3 visíveis
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("faz padding até 8 linhas quando log tem menos rondas", () => {
    render(
      <MoveLog log={makeLog(2)} currentPlayer={0} gridSize={7} resetKey={0} />
    );
    const rows = screen.getAllByRole("row"); // inclui header
    // header (1) + 8 linhas de corpo = 9
    expect(rows.length).toBe(9);
  });

  test("converte coordenadas para notação col+row com eixo Y invertido", () => {
    // gridSize=7 -> rowLabel = 7 - row
    // P1: [0,0] -> a7 ; P2: [0,1] -> b7
    render(
      <MoveLog log={makeLog(1)} currentPlayer={0} gridSize={7} resetKey={0} />
    );

    // linha da ronda 1
    const bodyRows = screen.getAllByRole("row").slice(1);
    const r1 = bodyRows[0];
    const cells = within(r1).getAllByRole("cell"); // [Ronda, J1, J2]

    expect(cells[1]).toHaveTextContent("a7");
    expect(cells[2]).toHaveTextContent("b7");
  });

  test('aplica classe "active" na coluna do jogador atual quando há jogada', () => {
    render(
      <MoveLog log={makeLog(2)} currentPlayer={1} gridSize={7} resetKey={0} />
    );
    const bodyRows = screen.getAllByRole("row").slice(1);

    // escolhe uma linha onde ambos têm jogada
    const row = bodyRows[1];
    const cells = within(row).getAllByRole("cell");
    const j1 = cells[1];
    const j2 = cells[2];

    expect(j1).not.toHaveClass("active");
    expect(j2).toHaveClass("active");
  });

  test("scrolla para o fim quando o log cresce", () => {
    const { container, rerender } = render(
      <MoveLog log={makeLog(2)} currentPlayer={0} gridSize={7} resetKey={0} />
    );

    const wrapper = container.querySelector(".move-log-container");
    // jsdom não calcula layout: definimos manualmente scrollHeight/scrollTop
    Object.defineProperty(wrapper, "scrollHeight", {
      value: 100,
      configurable: true,
    });
    wrapper.scrollTop = 0;

    rerender(
      <MoveLog log={makeLog(3)} currentPlayer={0} gridSize={7} resetKey={0} />
    );

    expect(wrapper.scrollTop).toBe(100);
  });

  test("ao mudar resetKey, volta ao topo (scrollTop=0)", () => {
    const { container, rerender } = render(
      <MoveLog log={makeLog(5)} currentPlayer={0} gridSize={7} resetKey={0} />
    );
    const wrapper = container.querySelector(".move-log-container");
    // simula que estava scrolado
    Object.defineProperty(wrapper, "scrollHeight", {
      value: 200,
      configurable: true,
    });
    wrapper.scrollTop = 200;

    rerender(
      <MoveLog log={makeLog(5)} currentPlayer={0} gridSize={7} resetKey={1} />
    );
    expect(wrapper.scrollTop).toBe(0);
  });

  test("mantém 8 linhas visíveis mesmo com log > 8 (sem truncar)", () => {
    render(
      <MoveLog log={makeLog(10)} currentPlayer={0} gridSize={7} resetKey={0} />
    );
    const bodyRows = screen.getAllByRole("row").slice(1);
    // Não trunca: mostra todas as rondas (10 aqui)
    expect(bodyRows.length).toBe(10);
  });
});
