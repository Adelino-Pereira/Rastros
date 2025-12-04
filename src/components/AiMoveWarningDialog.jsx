import React from "react";

export function AiMoveWarningDialog({
  open,
  dontWarnAgain,
  onToggleDontWarn,
  onCancel,
  onProceed,
}) {
  if (!open) return null;

  return (
    <div className="winner-message" role="dialog" aria-modal="true">
      <h2>Aviso</h2>
      <p>
        Se prosseguir, este jogo <strong>não</strong> será contabilizado nas
        estatísticas do histórico.
      </p>
      <label
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        <input
          type="checkbox"
          checked={dontWarnAgain}
          onChange={(e) => onToggleDontWarn(e.target.checked)}
        />
        Não mostrar este aviso novamente
      </label>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          justifyContent: "center",
        }}
      >
        <button onClick={onCancel}>Cancelar</button>
        <button onClick={onProceed}>Prosseguir</button>
      </div>
    </div>
  );
}
