// Funções para converter coordenadas do tabuleiro em notação legível
// e construir o CSV de download do histórico

export function renderMove(move, gridSize) {
  // move = [row, col] em índices 0-based; devolve ex.: "b3"
  if (!Array.isArray(move)) return "";
  const [row, col] = move;
  const rowLabel = gridSize - row; // inverte eixo Y para ficar bottom-up
  const colLabel = String.fromCharCode(97 + col); // 'a', 'b', ...
  return `${colLabel}${rowLabel}`;
}

export function generateLogText(log, gridSize) {
  // Constroi CSV com cabeçalho e rondas P1/P2 em notação de tabuleiro
  let output = "Ronda nº,Jogador 1,Jogador 2\n";
  log.forEach((round, index) => {
    const p1 = round[0] ? renderMove(round[0], gridSize) : "";
    const p2 = round[1] ? renderMove(round[1], gridSize) : "";
    output += `${index + 1},${p1},${p2}\n`;
  });
  return output;
}
