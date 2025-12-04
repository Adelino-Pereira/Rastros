import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
// Mock do Sound para não tocar áudio em testes
vi.mock("../../utils/soundManager", () => ({
  default: { play: vi.fn() },
}));

import Sidebar from "../Sidebar";

describe("Sidebar", () => {
  test("renderiza children quando aberto", () => {
    render(
      <Sidebar open={true} onClose={() => {}}>
        <p>Conteúdo interno</p>
      </Sidebar>
    );

    expect(screen.getByText("Conteúdo interno")).toBeInTheDocument();
  });

  test("não mostra children quando fechado (aria-hidden=true)", () => {
    render(
      <Sidebar open={false} onClose={() => {}}>
        <p>Oculto</p>
      </Sidebar>
    );

    const aside = screen.getByLabelText("Sidebar");
    expect(aside).toHaveAttribute("aria-hidden", "true");
  });

  test("chama onClose quando se clica no overlay", () => {
    const onClose = vi.fn();
    render(
      <Sidebar open={true} onClose={onClose}>
        <p>Sidebar aberto</p>
      </Sidebar>
    );

    const overlay =
      screen.getByRole("presentation", { hidden: true }) ||
      screen.getByText("Sidebar aberto").parentElement.previousSibling;

    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  test("chama onClose quando se clica no botão ×", () => {
    const onClose = vi.fn();
    render(
      <Sidebar open={true} onClose={onClose}>
        <p>Sidebar aberto</p>
      </Sidebar>
    );

    const btn = screen.getByRole("button", { name: /fechar/i });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });

  test("bloqueia scroll do body quando aberto e repõe quando fechado", () => {
    const { rerender } = render(
      <Sidebar open={true} onClose={() => {}}>
        <p>Sidebar aberto</p>
      </Sidebar>
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Sidebar open={false} onClose={() => {}}>
        <p>Sidebar fechado</p>
      </Sidebar>
    );

    expect(document.body.style.overflow).toBe("");
  });

  test("pressionar Escape chama onClose", () => {
    const onClose = vi.fn();
    render(
      <Sidebar open={true} onClose={onClose}>
        <p>Sidebar aberto</p>
      </Sidebar>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
