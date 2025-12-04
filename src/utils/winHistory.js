// src/utils/aiWins.js
const STORAGE_KEY = "slimeTrail_aiWins_v3";

export const MODES = {
  HUMAN_FIRST: "human_first", // Human is P1, AI is P2
  AI_FIRST: "ai_first",       // AI is P1, Human is P2
};

function isoNow() { return new Date().toISOString(); }

function mkSide() {
  return { played: 0, wins: 0, byBoard: {} /* "7x7": {played,wins} */ };
}
function makeLevels(n = 10) {
  const out = {};
  for (let i = 1; i <= n; i++) out[String(i)] = { asP1: mkSide(), asP2: mkSide() };
  return out;
}

function emptyStats() {
  return { v: 3, updatedAt: isoNow(), levels: makeLevels(10) };
}

export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw);
    if (parsed?.v === 3) return parsed;

    // simple migration from v2 (no per-board): keep totals, add empty byBoard
    if (parsed?.v === 2 && parsed.levels) {
      for (const lvl of Object.values(parsed.levels)) {
        if (!lvl.asP1.byBoard) lvl.asP1.byBoard = {};
        if (!lvl.asP2.byBoard) lvl.asP2.byBoard = {};
      }
      return { ...parsed, v: 3 };
    }
    return emptyStats();
  } catch {
    return emptyStats();
  }
}

function save(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }

/**
 * @param {{
 *   mode: "human_first"|"ai_first",
 *   level: number|string,        // 1..10
 *   winner: 1|2,                 // P1 or P2
 *   board: string                // e.g., "7x7"
 * }} p
 */
export function recordAiVsGame({ mode, level, winner, board }) {
  if (mode !== MODES.HUMAN_FIRST && mode !== MODES.AI_FIRST) return getStats();

  const lvlKey = String(level ?? "1");
  const s = getStats();
  if (!s.levels[lvlKey]) s.levels[lvlKey] = { asP1: mkSide(), asP2: mkSide() };

  const sideKey = mode === MODES.HUMAN_FIRST ? "asP1" : "asP2";
  const side = s.levels[lvlKey][sideKey];

  side.played += 1;
  if ((sideKey === "asP1" && winner === 1) || (sideKey === "asP2" && winner === 2)) side.wins += 1;

  // per-board
  const b = board || "unknown";
  side.byBoard[b] ??= { played: 0, wins: 0 };
  side.byBoard[b].played += 1;
  if ((sideKey === "asP1" && winner === 1) || (sideKey === "asP2" && winner === 2)) side.byBoard[b].wins += 1;

  s.updatedAt = isoNow();
  save(s);
  return s;
}

export function resetAiWins() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Collect the set of boards that have any played games. */
export function boardsPlayed(stats = getStats()) {
  const set = new Set();
  for (const lvl of Object.values(stats.levels)) {
    for (const b of Object.keys(lvl.asP1.byBoard)) if (b !== "unknown" && lvl.asP1.byBoard[b].played) set.add(b);
    for (const b of Object.keys(lvl.asP2.byBoard)) if (b !== "unknown" && lvl.asP2.byBoard[b].played) set.add(b);
  }
  return Array.from(set).sort((a,b) => {
    const [ar,ac] = a.split("x").map(Number); const [br,bc] = b.split("x").map(Number);
    return ar - br || ac - bc;
  });
}

/** Helper to get counts for a level, either aggregated or filtered by board. */
export function countsForLevel(levelData, board /* string or "all" */) {
  const pick = (side) => {
    if (!board || board === "all") return side;
    const cell = side.byBoard[board] || { played: 0, wins: 0 };
    return { played: cell.played, wins: cell.wins };
  };
  return { asP1: pick(levelData.asP1), asP2: pick(levelData.asP2) };
}

/** Totals across all (or a board) for footer. */
export function totals(stats = getStats(), board = "all") {
  const t = { asP1: { played: 0, wins: 0 }, asP2: { played: 0, wins: 0 } };
  for (const lvl of Object.values(stats.levels)) {
    const c = countsForLevel(lvl, board);
    t.asP1.played += c.asP1.played; t.asP1.wins += c.asP1.wins;
    t.asP2.played += c.asP2.played; t.asP2.wins += c.asP2.wins;
  }
  return t;
}
