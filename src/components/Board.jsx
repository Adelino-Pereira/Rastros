import React, { useEffect } from "react";

export default function Board({ grid, marker, validMoves, onCellClick, gameStarted }) {

const rows = grid.length;
const cols = rows > 0 ? grid[0].length : 0;

  const p1GoalReached = marker && marker[0] === rows - 1 && marker[1] === 0;
  const p2GoalReached = marker && marker[0] === 0 && marker[1] === cols - 1;

  const totalCols = cols + 1; // +1 para etiquetas de linha à esquerda
  const totalRows = rows + 1;

  // Tabuleiro cabe em ~70vmin; cada célula = BOARD_VMIN / max(totalRows, totalCols)
  const BOARD_VMIN = 70;
  const cellSizeVmin = BOARD_VMIN / Math.max(totalCols, totalRows);

  const isValidMove = (r, c) =>
    validMoves.some(([vr, vc]) => vr === r && vc === c);

  const renderCell = (r, c) => {
    const isMarker = marker && marker[0] === r && marker[1] === c;
    const cellVal = grid[r][c];
    const isValid = isValidMove(r, c);
    const isBlocked = cellVal === 0; // casa já usada/bloqueada

    const classNames = ["cell"];
    if (isBlocked && !isMarker) classNames.push("blocked");
    if (isValid) classNames.push("valid");

    return (
      <div
        key={`cell-${r}-${c}`}
        className={classNames.join(" ")}
        onClick={() => onCellClick(r, c)}
      >
          {isMarker && <div className="marker-circle" />}
        {!isMarker && r === rows - 1 && c === 0 && !p1GoalReached && (
          <span className="goal-label">1</span>
        )}
        {!isMarker && r === 0 && c === cols - 1 && !p2GoalReached && (
          <span className="goal-label">2</span>
        )}
      </div>
    );
  };

  const colLabels = Array.from({ length: cols }, (_, i) =>
    String.fromCharCode(97 + i)
  );



  return (
    <div className="board-wrapper"
      style={{
        
        opacity: gameStarted ? 1 : 0.5, // visual: desliga intensidade antes de iniciar
        pointerEvents: gameStarted ? "auto" : "none", // bloqueia cliques antes do start
        
        
        marginLeft:"-5%"
      }}
      >
      <div
        className="board-grid"
        style={{
          // CSS var controla tamanho base de célula em função do viewport
          ['--cell']: `${cellSizeVmin}vmin`,
          display: "grid",
          gridTemplateColumns: `var(--cell) repeat(${cols}, var(--cell))`,
          gridTemplateRows: `repeat(${rows}, var(--cell)) var(--cell)`,
          gap: `calc(var(--cell) * 0.06)`, // escala proporcional ao tamanho da célula
          // Mantém o tabuleiro dentro do viewport
          width: `calc(var(--cell) * ${totalCols})`,
          height: `calc(var(--cell) * ${totalRows})`,
          placeContent: "center"
        }}
      >
        {/* Linhas desenhadas de cima para baixo; rótulos contam de baixo para cima */}
        {Array.from({ length: rows }, (_, r) => {
          const rowLabel = rows - r;
          return (
            <React.Fragment key={`row-${r}`}>
              <div className="cell-label">{rowLabel}</div>
              {Array.from({ length: cols }).map((_, c) => renderCell(r, c))}
            </React.Fragment>
          );
        })}

        {/* Canto inferior esquerdo vazio */}
        <div></div>

        {/* Etiquetas das colunas na base */}
        {colLabels.map((label) => (
          <div key={`col-${label}`} className="cell-label">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
