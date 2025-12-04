import React from "react";

export function WinnerMessage({ winner, onDownload, onBack }) {
  if (!winner) return null;

  return (
    <div className="winner-message">
      {winner <= 2 && <h2>Vitória do Jogador {winner}!</h2>}
      {winner > 2 && (
        <h2>
          Jogador bloqueado!
          <br />
          Vitória do Jogador {winner / 3}!
        </h2>
      )}
      <button onClick={onDownload}> Baixar registo do jogo</button>
      <button onClick={onBack}>Voltar</button>
    </div>
  );
}
