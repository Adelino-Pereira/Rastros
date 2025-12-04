// utils/applyPuzzleToEngine.js
export function applyPuzzleToEngine(p, board) {
  board.resetBoard(p.rows, p.cols, false); // don't auto-block center

  // Block all listed cells EXCEPT the marker cell (defensive)
  const [mr, mc] = p.marker;
  for (const [r, c] of p.blocked) {
    if (r === mr && c === mc) continue;
    board.blockCell(r, c);
  }

  // Place marker WITHOUT blocking it
  board.setMarker(mr, mc, false);
}
