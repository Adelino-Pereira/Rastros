import { applyPuzzleToEngine } from "./applyPuzzleToEngine";
import { convertMarker } from "./wasmConverters";

/**
 * Prepara um puzzle no motor WASM e devolve os artefactos prontos para INIT_GAME.
 * Centraliza a lógica de grid/marcador/IA para não duplicar nos handlers do hook.
 */
export function preparePuzzleGame({
  puzzle,
  wasm,
  makeAi,
  maxDepth,
  difficulty,
  buildGridAndMoves,
  countBlocked,
  whoMovesFromParity,
  buildInitialMoveLog,
  countPreMoves,
  markerFromBoard = (board) => {
    const mk = board.getMarker();
    if (mk && typeof mk.get === "function") return [mk.get(0), mk.get(1)];
    if (mk && typeof mk.first === "number") return [mk.first, mk.second];
    if (Array.isArray(mk) && mk.length >= 2) return mk;
    return convertMarker(mk);
  },
}) {
  if (!wasm || !puzzle) return null;

  // Cria e injeta o puzzle no Board nativo
  const board = new wasm.Board(puzzle.rows, puzzle.cols);
  applyPuzzleToEngine(puzzle, board);

  // Deriva grid, jogadas válidas e marcador em formato JS
  const { grid, validMoves } = buildGridAndMoves(board);
  const marker = markerFromBoard(board);

  // Quem joga? Paridade de casas bloqueadas
  const blocked = countBlocked(board);
  const playerToMove = whoMovesFromParity(blocked);
  board.setCurrentPlayerInt(playerToMove);

  // IA(s) só para o lado não humano
  const humanIsP1 = playerToMove === 1;
  const ai1 = humanIsP1
    ? null
    : makeAi({ wasm, isMax: true, depth: maxDepth, level: difficulty, debug: 0 });
  const ai2 = humanIsP1
    ? makeAi({ wasm, isMax: false, depth: maxDepth, level: difficulty, debug: 0 })
    : null;

  // Payload adicional (log, rondas e modo)
  const moveLog = buildInitialMoveLog(puzzle);
  const round = countPreMoves(puzzle);
  const mode = humanIsP1 ? "human_first" : "ai_first";
  const currentPlayerIdx = playerToMove === 1 ? 0 : 1;

  return {
    board,
    grid,
    validMoves,
    marker,
    ai1,
    ai2,
    moveLog,
    round,
    mode,
    currentPlayerIdx,
    humanIsP1,
  };
}
