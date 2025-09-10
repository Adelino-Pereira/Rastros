import React, { useMemo, useState, useReducer, useEffect } from "react";
import { getStats, resetAiWins, totals, boardsPlayed, countsForLevel } from "../utils/WinHistory";
import Sound from "../utils/soundManager";

function pct(wins, played) {
  return played ? `${Math.round((wins / played) * 100)}%` : "—";
}

export default function WinHistoryDialog({ open, onClose }) {
  if (!open) return null;

  const [board, setBoard] = useState("all");
  const [version, bump] = useReducer(v => v + 1, 0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const stats = useMemo(() => getStats(), [version]);
  const boardOptions = useMemo(() => ["all", ...boardsPlayed(stats)], [stats]);
  const all = useMemo(() => totals(stats, board), [stats, board]);
  const totalPlayed = all.asP1.played + all.asP2.played;

  // Auto-close the tip
  useEffect(() => {
    if (!showTip) return;
    const t = setTimeout(() => setShowTip(false), 1600);
    return () => clearTimeout(t);
  }, [showTip]);

  const handleClose = () => {
    Sound.play("button");
    onClose?.();
  };

  const handleClearClick = () => {
    Sound.play("button");
    if (totalPlayed > 0) {
      setConfirmOpen(true);
    } else {
      setShowTip(true); // show “não há estatísticas…” tip
    }
  };

  const handleClearConfirm = () => {
    resetAiWins();
    bump();
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="rb-modal-overlay" role="dialog" aria-modal="true" aria-label="AI vs Stats">
        <div className="rb-modal">
          <header className="rb-modal-header">
            <h3>Estatísticas (AI vs)</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label className="rb-text">Tabuleiro:</label>
              <select value={board} onChange={(e) => setBoard(e.target.value)}>
                {boardOptions.map(b => <option key={b} value={b}>{b === "all" ? "Todos" : b}</option>)}
              </select>
            </div>
            <button className="rb-icon-btn" onClick={handleClose} aria-label="Fechar">✕</button>
          </header>

          <section className="rb-modal-section">
            <p>Para cada nível (1–10), mostra partidas jogadas e vitórias quando jogaste como <strong>J1</strong> e quando jogaste como <strong>J2</strong>.</p>
            <table className="rb-table">
              <thead>
                <tr>
                  <th className="rb-divide-right">Nível</th>
                  <th>Jogos P1</th><th>Vitórias P1</th><th className="rb-divide-right">% Vitórias J1</th>
                  <th>Jogos P2</th><th>Vitórias P2</th><th className="rb-divide-right">% Vitórias J2</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.levels)
                  .sort((a,b)=>Number(a[0])-Number(b[0]))
                  .map(([lvl, data]) => {
                    const c = countsForLevel(data, board);
                    return (
                      <tr key={lvl}>
                        <td className="rb-divide-right">{lvl}</td>
                        <td>{c.asP1.played}</td>
                        <td>{c.asP1.wins}</td>
                        <td className="rb-divide-right">{pct(c.asP1.wins, c.asP1.played)}</td>
                        <td>{c.asP2.played}</td>
                        <td>{c.asP2.wins}</td>
                        <td className="rb-divide-right">{pct(c.asP2.wins, c.asP2.played)}</td>
                      </tr>
                    );
                  })}
              </tbody>
              <tfoot>
                <tr>
                  <th className="rb-divide-right">Total</th>
                  <th>{all.asP1.played}</th>
                  <th>{all.asP1.wins}</th>
                  <th className="rb-divide-right">{pct(all.asP1.wins, all.asP1.played)}</th>
                  <th>{all.asP2.played}</th>
                  <th>{all.asP2.wins}</th>
                  <th className="rb-divide-right">{pct(all.asP2.wins, all.asP2.played)}</th>
                </tr>
              </tfoot>
            </table>
            <p className="rb-note">Apenas jogos <em>disputados com a IA</em></p>
          </section>

          <footer className="rb-modal-footer">
            <div className="rb-tip-wrap">
              <button className="rb-btn" onClick={handleClearClick}>
                Limpar estatísticas
              </button>

              {showTip && (
                <div className="rb-tip" role="status" aria-live="polite">
                  Não há estatísticas para apagar
                </div>
              )}
            </div>
          </footer>
        </div>
      </div>

      {confirmOpen && (
        <div className="winner-message">
          <h2>Confirmar</h2>
          <p>Desejas mesmo limpar as estatísticas?</p>
          <div>
            <button onClick={() => setConfirmOpen(false)}>Cancelar</button>
            <button onClick={handleClearConfirm}>Continuar</button>
          </div>
        </div>
      )}
    </>
  );
}