import React from "react";

export default function GridSizeSelector({ rows, cols, onSelect, disabled }) {
  const minSize = 5;
  const maxSize = 11;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = {
      rows,
      cols,
      [name]: Number(value),
    };
    onSelect(updated);
  };

  return (
    <div className="grid-size-selector">
    <div className="gridSizeLabel">
        Tabuleiro
    </div>
      <div className="slider-group">
        <label htmlFor="rows">Altura&nbsp;&nbsp;&nbsp;: {rows}</label>
        <input
          type="range"
          id="rows"
          name="rows"
          min={minSize}
          max={maxSize}
          value={rows}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div className="slider-group">
        <label htmlFor="cols">Largura: {cols}</label>
        <input
          type="range"
          id="cols"
          name="cols"
          min={minSize}
          max={maxSize}
          value={cols}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
