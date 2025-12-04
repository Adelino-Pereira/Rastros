import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AiMoveWarningDialog } from "../AiMoveWarningDialog";

describe("AiMoveWarningDialog", () => {
  it("não renderiza quando fechado", () => {
    const { container } = render(
      <AiMoveWarningDialog
        open={false}
        dontWarnAgain={false}
        onToggleDontWarn={() => {}}
        onCancel={() => {}}
        onProceed={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza e aciona handlers", () => {
    const onToggle = vi.fn();
    const onCancel = vi.fn();
    const onProceed = vi.fn();

    render(
      <AiMoveWarningDialog
        open
        dontWarnAgain={false}
        onToggleDontWarn={onToggle}
        onCancel={onCancel}
        onProceed={onProceed}
      />
    );

    fireEvent.click(screen.getByText(/Cancelar/i));
    fireEvent.click(screen.getByRole("button", { name: /Prosseguir/i }));
    fireEvent.click(screen.getByRole("checkbox"));

    expect(onCancel).toHaveBeenCalled();
    expect(onProceed).toHaveBeenCalled();
    expect(onToggle).toHaveBeenCalled();
  });
});
