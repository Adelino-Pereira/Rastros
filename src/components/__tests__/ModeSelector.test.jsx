import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ModeSelector from "../ModeSelector";

describe("ModeSelector", () => {
  test("renderiza todas as opções de modo de jogo", () => {
    render(
      <ModeSelector
        value="human_vs_human"
        onSelect={() => {}}
        disabled={false}
      />
    );

    expect(
      screen.getByRole("option", { name: /Humano vs Humano/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /Humano vs IA/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /IA vs Humano/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /IA vs IA/i })
    ).toBeInTheDocument();
  });

  test("respeita o valor inicial selecionado", () => {
    render(
      <ModeSelector value="ai_first" onSelect={() => {}} disabled={false} />
    );

    const select = screen.getByRole("combobox", { name: /Modo de jogo/i });
    expect(select).toHaveValue("ai_first");
  });

  test("chama onSelect quando o utilizador muda a opção", () => {
    const onSelect = vi.fn();
    render(
      <ModeSelector
        value="human_vs_human"
        onSelect={onSelect}
        disabled={false}
      />
    );

    const select = screen.getByRole("combobox", { name: /Modo de jogo/i });

    fireEvent.change(select, { target: { value: "ai_vs_ai" } });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("ai_vs_ai");
  });

  test("fica desativado quando disabled=true", () => {
    render(
      <ModeSelector value="human_vs_human" onSelect={() => {}} disabled />
    );

    const select = screen.getByRole("combobox", { name: /Modo de jogo/i });
    expect(select).toBeDisabled();
  });
});
