
// função auxiliar para converter o tabuleiro de jogo
//*não está a ser utilizada, conversão está a ser feita em handleStartGame src/app.jsx
export function convertWasmGrid(wasmGrid) {
  if (!wasmGrid || typeof wasmGrid.size !== "function") return [];

  const updatedGrid = [];
  for (let i = 0; i < wasmGrid.size(); i++) {
    const row = wasmGrid.get(i);
    const rowArr = [];
    if (row && typeof row.size === "function") {
      for (let j = 0; j < row.size(); j++) {
        rowArr.push(row.get(j));
      }
    }
    updatedGrid.push(rowArr);
  }
  return updatedGrid;
}
