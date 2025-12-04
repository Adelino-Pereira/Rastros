import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { WinnerMessage } from "../WinnerMessage";

describe("WinnerMessage", () => {
  it("mostra vitória do jogador 1 e aciona callbacks", () => {
    const onDownload = vi.fn();
    const onBack = vi.fn();

    render(
      <WinnerMessage winner={1} onDownload={onDownload} onBack={onBack} />
    );

    expect(screen.getByText(/Vitória do Jogador 1/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Baixar registo/i));
    fireEvent.click(screen.getByText(/Voltar/i));

    expect(onDownload).toHaveBeenCalled();
    expect(onBack).toHaveBeenCalled();
  });

  it("mostra vitória por bloqueio", () => {
    render(<WinnerMessage winner={6} onDownload={() => {}} onBack={() => {}} />);
    expect(screen.getByText(/Jogador bloqueado/i)).toBeInTheDocument();
    expect(screen.getByText(/Vitória do Jogador 2/i)).toBeInTheDocument();
  });

  it("não renderiza quando winner é falsy", () => {
    const { container } = render(
      <WinnerMessage winner={null} onDownload={() => {}} onBack={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });
});
