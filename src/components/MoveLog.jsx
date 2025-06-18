import React, { useEffect, useRef } from "react";

export default function MoveLog({ log, currentPlayer, gridSize, resetKey }) {
  const maxVisibleRows = 8;

  // Ref para o contentor para fazer scrol
  const scrollRef = useRef(null);

  // Pad para garantir pelo menos 10 linhas
  const paddedLog = [...log];
  while (paddedLog.length < maxVisibleRows) {
    paddedLog.push([null, null]);
  }

  // Scroll automático ao acrecentar novas linhas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [resetKey]);


 // no código C++ as coordenadas do tabuleiro foram configuradas
 // no eixo vertical (rows) de cima para baixo
 // no eixo horizontal (cols) da esq  para direita
 // troca-se a seguir as coordenadas do eixo Y para coincidir com tabuleiro original

  const renderMove = (move) => {
    if (!Array.isArray(move)) return "";
    const [row, col] = move;
    const rowLabel = gridSize - row; // troca eixo Y para coincidir com original
    const colLabel = String.fromCharCode(97 + col);
    return `${colLabel}${rowLabel}`;
  };

  return (
    <div className="move-log-container" ref={scrollRef}>
      <table className="move-log-table">
        <thead>
          <tr>
            <th>Ronda</th>
            <th className={currentPlayer === 0 ? "active" : ""}>Jogador 1</th>
            <th className={currentPlayer === 1  ? "active" : ""}>Jogador 2</th>
          </tr>
        </thead>
          <tbody>
            {paddedLog.map((round, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td className={currentPlayer === 0 && round[0] ? "active" : ""}>
                  {renderMove(round[0])}
                </td>
                <td className={currentPlayer === 1 && round[1] ? "active" : ""}>
                  {renderMove(round[1])}
                </td>
              </tr>
            ))}
          </tbody>

      </table>
    </div>
  );
}
