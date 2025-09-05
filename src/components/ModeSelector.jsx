// src/ModeSelector.jsx
import React from "react";
import Sound from "../utils/soundManager";

export default function ModeSelector({ onSelect, value, disabled }) {
  const [mode, setMode] = React.useState("");

  const handleChange = (e) => {
    const selected = e.target.value;
    setMode(selected);
    onSelect(selected);
  };

  return (
    <div className="selector">
    <div className="selector-label">
      <label htmlFor="mode">Modo de jogo:</label>
    </div>
      <select id="mode" onChange={handleChange} value={value} disabled={disabled}>
        <option value="human_vs_human">1: Humano vs Humano</option>
        <option value="human_first">2: Humano vs IA</option>
        <option value="ai_first">3: IA vs Humano</option>
        <option value="ai_vs_ai">4: IA vs IA</option>
      </select>
    </div>
  );
}
