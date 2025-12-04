import React from "react";
import ModeSelector from "./ModeSelector";
import GridSizeSelector from "./GridSizeSelector";
import DifficultySelector from "./DifficultySelector";

export function SettingsPanel({
  mode,
  onSelectMode,
  rows,
  cols,
  onSelectDims,
  difficulty,
  onChangeDifficulty,
  gameStarted,
  onHistory,
  onOpenRules,
  soundOn,
  onToggleSound,
  theme,
  onChangeTheme,
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="selectors">
        <ModeSelector
          value={mode}
          onSelect={onSelectMode}
          disabled={gameStarted}
        />
        <GridSizeSelector
          rows={rows}
          cols={cols}
          onSelect={onSelectDims}
          disabled={gameStarted}
        />

        <DifficultySelector
          value={difficulty}
          onChange={onChangeDifficulty}
          disabled={gameStarted}
        />
      </div>

      <button onClick={onHistory} style={{ marginTop: 8 }}>
        Ver estatísticas
      </button>

      <button
        className="mt-2 w-full rounded-2xl border px-3 py-2 text-sm hover:bg-gray-50"
        onClick={onOpenRules}
      >
        Regras do Jogo
      </button>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "black",
        }}
      >
        <input
          type="checkbox"
          checked={soundOn}
          onChange={(e) => onToggleSound(e.target.checked)}
        />
        Som
      </label>
      <div>
        <div style={{ fontSize: 12, color: "#666" }}>Tema</div>
        <select value={theme} onChange={onChangeTheme} style={{ width: "100%" }}>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </select>
      </div>
    </div>
  );
}
