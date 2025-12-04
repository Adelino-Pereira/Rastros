import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GridSizeSelector from "../GridSizeSelector";

// valores permitidos (5..11)
const sizes = [5, 6, 7, 8, 9, 10, 11];

describe("GridSizeSelector", () => {
  test.each(sizes.map((i) => [i]))(
    "desenha sliders com valores iniciais e labels corretos (rows=cols=%i)",
    (i) => {
      render(
        <GridSizeSelector
          rows={i}
          cols={i}
          onSelect={() => {}}
          disabled={false}
        />
      );

      const rowSlider = screen.getByRole("slider", { name: /altura/i });
      const colSlider = screen.getByRole("slider", { name: /largura/i });

      expect(rowSlider).toHaveValue(String(i));
      expect(colSlider).toHaveValue(String(i));

      expect(screen.getByText(/Altura/)).toHaveTextContent("Altura");
      expect(screen.getByText(/Largura/)).toHaveTextContent("Largura");
    }
  );

  test.each([
    [5, 11],
    [7, 9],
    [10, 6],
  ])(
    "chama onSelect quando muda rows (%i) e mantém cols (%i)",
    (rows, cols) => {
      const onSelect = vi.fn();
      render(
        <GridSizeSelector
          rows={rows}
          cols={cols}
          onSelect={onSelect}
          disabled={false}
        />
      );

      const rowSlider = screen.getByRole("slider", { name: /altura/i });
      fireEvent.change(rowSlider, {
        target: { value: String(rows + 1 <= 11 ? rows + 1 : rows) },
      });

      // rows atualizado, cols mantido
      const expectedRows = rows + 1 <= 11 ? rows + 1 : rows;
      expect(onSelect).toHaveBeenCalledWith({ rows: expectedRows, cols });
    }
  );

  test.each([
    [5, 11],
    [7, 9],
    [10, 6],
  ])("chama onSelect quando muda cols (%i,%i)", (rows, cols) => {
    const onSelect = vi.fn();
    render(
      <GridSizeSelector
        rows={rows}
        cols={cols}
        onSelect={onSelect}
        disabled={false}
      />
    );

    const colSlider = screen.getByRole("slider", { name: /largura/i });
    fireEvent.change(colSlider, {
      target: { value: String(cols - 1 >= 5 ? cols - 1 : cols) },
    });

    const expectedCols = cols - 1 >= 5 ? cols - 1 : cols;
    expect(onSelect).toHaveBeenCalledWith({ rows, cols: expectedCols });
  });

  test("respeita limites min/max (5–11)", () => {
    render(
      <GridSizeSelector
        rows={5}
        cols={11}
        onSelect={() => {}}
        disabled={false}
      />
    );
    const rowSlider = screen.getByRole("slider", { name: /altura/i });
    const colSlider = screen.getByRole("slider", { name: /largura/i });
    expect(rowSlider).toHaveAttribute("min", "5");
    expect(rowSlider).toHaveAttribute("max", "11");
    expect(colSlider).toHaveAttribute("min", "5");
    expect(colSlider).toHaveAttribute("max", "11");
  });

  test("quando disabled, sliders estão inativos", () => {
    render(<GridSizeSelector rows={7} cols={7} onSelect={() => {}} disabled />);
    expect(screen.getByRole("slider", { name: /altura/i })).toBeDisabled();
    expect(screen.getByRole("slider", { name: /largura/i })).toBeDisabled();
  });
});
