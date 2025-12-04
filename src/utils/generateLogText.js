// src/generateLogText.js
//Funções para converter as coordenadas do tabuleiro 
//e criar log para fazer download no final do jogo

export function renderMove(move, gridSize) {
  if (!Array.isArray(move)) return "";
  const [row, col] = move;
  const rowLabel = gridSize - row; // flip Y axis
  const colLabel = String.fromCharCode(97 + col); // 'a', 'b', ...
  return `${colLabel}${rowLabel}`;
}

export function generateLogText(log, gridSize) {
  let output = "Ronda nº,Jogador 1,Jogador 2\n";
  log.forEach((round, index) => {
    const p1 = round[0] ? renderMove(round[0], gridSize) : "";
    const p2 = round[1] ? renderMove(round[1], gridSize) : "";
    output += `${index + 1},${p1},${p2}\n`;
  });
  return output;
}
