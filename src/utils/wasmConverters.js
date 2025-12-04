// Helpers para converter estruturas Emscripten (vetores/pairs) em formas JS

// Grid vindo do WASM (vector<int> plano) -> matriz JS [rows][cols]
export function convertGrid(flatVec, rows, cols) {
  const flat = [];
  if (flatVec) {
    const size =
      typeof flatVec.size === "function" ? flatVec.size() : flatVec.length || 0;
    for (let i = 0; i < size; i++) {
      flat.push(
        typeof flatVec.get === "function" ? flatVec.get(i) : flatVec[i]
      );
    }
  }
  const out = [];
  for (let r = 0; r < rows; r++) {
    const start = r * cols;
    out.push(flat.slice(start, start + cols));
  }
  return out;
}

export function convertValidMoves(rawMoves) {
  const parsed = [];
  if (!rawMoves) return parsed;
  const hasSize = typeof rawMoves.size === "function";
  const hasGet = typeof rawMoves.get === "function";

  // Caso 1: vector<int> plano (getFlatValidMoves embind)
  if (hasSize && hasGet && typeof rawMoves.get(0) === "number") {
    for (let i = 0; i + 1 < rawMoves.size(); i += 2) {
      parsed.push([rawMoves.get(i), rawMoves.get(i + 1)]);
    }
    return parsed;
  }

  // Caso 2: vector<pair<int,int>> (ex: getValidMoves)
  if (hasSize && hasGet) {
    for (let i = 0; i < rawMoves.size(); i++) {
      const mv = rawMoves.get(i);
      parsed.push([
        typeof mv.get === "function" ? mv.get(0) : mv[0],
        typeof mv.get === "function" ? mv.get(1) : mv[1],
      ]);
    }
    return parsed;
  }

  // Caso 3: array plano JS [r0,c0,r1,c1,...]
  if (Array.isArray(rawMoves) && rawMoves.length % 2 === 0) {
    for (let i = 0; i < rawMoves.length; i += 2) {
      parsed.push([rawMoves[i], rawMoves[i + 1]]);
    }
  }
  return parsed;
}

export function convertMarker(rawMarker) {
  if (rawMarker && Array.isArray(rawMarker)) {
    // já é vetor plano [r,c]
    return rawMarker.length >= 2 ? rawMarker : [0, 0];
  }
  if (
    rawMarker &&
    typeof rawMarker.size === "function" &&
    typeof rawMarker.get === "function"
  ) {
    // vector<int> de tamanho 2 (getFlatMarker via embind)
    if (rawMarker.size() >= 2) return [rawMarker.get(0), rawMarker.get(1)];
  }
  if (rawMarker && typeof rawMarker.get === "function") {
    // par embind (getMarker)
    return [rawMarker.get(0), rawMarker.get(1)];
  }
  if (
    rawMarker &&
    typeof rawMarker.first === "number" &&
    typeof rawMarker.second === "number"
  ) {
    return [rawMarker.first, rawMarker.second];
  }
  if (Array.isArray(rawMarker) && rawMarker.length >= 2) return rawMarker;
  return [0, 0];
}
