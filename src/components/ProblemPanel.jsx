import React from "react";

export function ProblemPanel({ problemState, onStartRandom, onReset }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#666" }}>Problemas</div>
      <button onClick={onStartRandom} style={{ marginTop: 8 }}>
        Novo problema aleatório
      </button>

      {problemState?.current && (
        <>
          <button onClick={onReset} style={{ marginTop: 8 }}>
            Reiniciar problema
          </button>
          <div style={{ marginTop: 6, fontSize: 12, color: "#333" }}>
            Estado: <strong>{problemState?.status ?? "idle"}</strong>
            <br />
            Movimentos:{" "}
            <strong>
              {problemState?.movesMade ?? 0}
              {problemState?.current?.movesLimit
                ? ` / ${problemState.current.movesLimit}`
                : ""}
            </strong>
          </div>
        </>
      )}
    </div>
  );
}
