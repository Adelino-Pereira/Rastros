import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PuzzleDialog } from "../PuzzleDialog";

const sampleProblem = {
  marker: [0, 0],
  blocked: [],
  movesLimit: 2,
};

describe("PuzzleDialog", () => {
  it("não renderiza quando fechado", () => {
    const { container } = render(
      <PuzzleDialog
        open={false}
        problemState={{ current: sampleProblem, status: "success" }}
        getBestMovesForPuzzle={() => null}
        onClose={() => {}}
        onRetry={() => {}}
        onNext={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("mostra estado failed e aciona retry/close", () => {
    const onClose = vi.fn();
    const onRetry = vi.fn();
    render(
      <PuzzleDialog
        open
        problemState={{ current: sampleProblem, status: "failed", movesMade: 3 }}
        getBestMovesForPuzzle={() => 2}
        onClose={onClose}
        onRetry={onRetry}
        onNext={() => {}}
      />
    );

    fireEvent.click(screen.getByText(/Fechar/i));
    fireEvent.click(screen.getByText(/Tentar de novo/i));

    expect(onClose).toHaveBeenCalled();
    expect(onRetry).toHaveBeenCalled();
  });

  it("mostra solução ótima e aciona next", () => {
    const onNext = vi.fn();
    render(
      <PuzzleDialog
        open
        problemState={{ current: sampleProblem, status: "success", movesMade: 2 }}
        getBestMovesForPuzzle={() => 2}
        onClose={() => {}}
        onRetry={() => {}}
        onNext={onNext}
      />
    );

    fireEvent.click(screen.getByText(/Outro problema/i));
    expect(onNext).toHaveBeenCalled();
  });
});
