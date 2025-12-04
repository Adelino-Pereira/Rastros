import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DifficultySelector from "../DifficultySelector";
import userEvent from "@testing-library/user-event";

describe("DifficultySelector", () => {
  describe("desenha o slider e vê se o número está correto", () => {
    for (let i = 1; i <= 10; i++) {
      test(`correto para o valor ${i}`, () => {
        render(
          <DifficultySelector value={i} onChange={() => {}} disabled={false} />
        );

        const slider = screen.getByRole("slider");
        expect(slider).toBeInTheDocument();
        expect(slider).toHaveValue(String(i)); // inputs guardam string

        expect(screen.getByText(String(i))).toBeInTheDocument();
      });
    }
  });
  //         validMoves={validMoves}

  test("chama onChange com o número quando se move o slider", () => {
    const onChange = vi.fn();

    render(
      <DifficultySelector value={3} onChange={onChange} disabled={false} />
    );
    const slider = screen.getByRole("slider");

    // Simulate user moving the range to 7
    fireEvent.input(slider, { target: { value: "7" } });
    // If your component uses onChange instead of onInput, this also covers it:
    fireEvent.change(slider, { target: { value: "7" } });

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(7); // number (the component should parse it)
  });

  test("não chama onChange quando está inativo", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DifficultySelector value={6} onChange={onChange} disabled />);

    const slider = screen.getByRole("slider");
    expect(slider).toBeDisabled(); // requires jest-dom

    // Try to change via keyboard (typical for range)
    await user.click(slider); // focus attempt
    await user.keyboard("{ArrowRight}"); // would increase value if enabled

    expect(onChange).not.toHaveBeenCalled();
  });

  test("respeita os limites máximos (1..10)", () => {
    render(
      <DifficultySelector value={5} onChange={() => {}} disabled={false} />
    );
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "10");
  });
});
