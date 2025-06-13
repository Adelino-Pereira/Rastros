
//função auxiliar para randomizar a primeira jogada da IA
//*já não é necessária, foi implementada no backend(C++)
export function getFirstMoveAI(marker, boardSize) {
  const [r, c] = marker;
  const goal = [0, boardSize - 1];

  const isAdjacentToGoal = ([x, y]) => {
    const [gx, gy] = goal;
    return (
      Math.abs(x - gx) <= 1 &&
      Math.abs(y - gy) <= 1
    );
  };

  const candidates = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ].filter(([x, y]) =>
    x >= 0 && x < boardSize &&
    y >= 0 && y < boardSize &&
    !isAdjacentToGoal([x, y])
  );

  if (candidates.length === 0) {
    console.warn("⚠️ No safe first moves available — using fallback.");
    return [r + 1, c]; // fallback (downward)
  }

  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}
