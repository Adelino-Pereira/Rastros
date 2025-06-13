import React, { useEffect } from "react";

export default function Board({ grid, marker, validMoves, onCellClick, gameStarted }) {

const rows = grid.length;
const cols = rows > 0 ? grid[0].length : 0;

  const p1GoalReached = marker && marker[0] === rows - 1 && marker[1] === 0;
  const p2GoalReached = marker && marker[0] === 0 && marker[1] === cols - 1;


  const isValidMove = (r, c) =>
    validMoves.some(([vr, vc]) => vr === r && vc === c);

  const renderCell = (r, c) => {
    const isMarker = marker && marker[0] === r && marker[1] === c;
    const cellVal = grid[r][c];
    const isValid = isValidMove(r, c);
    const isBlocked = cellVal === 0;

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
        opacity: gameStarted ? 1 : 0.5,
        pointerEvents: gameStarted ? "auto" : "none",
      }}
      >
      <div
        className="board-grid"
        style={{
          display: "grid",
          gridTemplateColumns: `40px repeat(${cols}, 40px)`,
          gridTemplateRows: `repeat(${rows}, 40px) 40px`,
          gap: "4px",
        }}
      >
        {/* Rows rendered top to bottom, labels increase bottom-up */}
        {Array.from({ length: rows }, (_, r) => {
          const rowLabel = rows - r;
          return (
            <React.Fragment key={`row-${r}`}>
              <div className="cell-label">{rowLabel}</div>
              {Array.from({ length: cols }).map((_, c) => renderCell(r, c))}
            </React.Fragment>
          );
        })}

        {/* Bottom-left empty corner */}
        <div></div>

        {/* Column labels at the bottom */}
        {colLabels.map((label) => (
          <div key={`col-${label}`} className="cell-label">
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
