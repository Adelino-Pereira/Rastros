import React from "react";

export default function DifficultySelector({ value, onChange, disabled }) {
  return (
    <div className="difficulty-selector">
      <div className="difficultyLabel">
          Dificuldade
      </div>
      <input
        type="range"
        id="difficulty"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
      <div className="difficultyLabel">
          {value}
      </div>
    </div>
  );
}
