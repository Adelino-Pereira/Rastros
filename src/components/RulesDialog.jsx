import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * RulesDialog — centered modal with scroll, NO Tailwind required.
 * Works even if the app doesn't use Tailwind utilities.
 */
export default function RulesDialog({ open, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(1px)",
    zIndex: 1000,
  };

  const containerStyle = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1001,
    padding: 16,
  };

  const panelStyle = {
    width: "min(90vw, 720px)",
    background: "#ffffff",
    color: "#111",
    borderRadius: 16,
    boxShadow:
      "0 10px 15px rgba(0,0,0,0.15), 0 4px 6px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    maxHeight: "80vh",
    outline: "none",
  };

  const headerStyle = {
    padding: 16,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background: "rgba(255,255,255,0.9)",
  };

  const bodyStyle = {
    padding: 16,
    overflowY: "auto",
  };

  const footerStyle = {
    padding: 12,
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    background: "rgba(255,255,255,0.9)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  };

  const closeBtnStyle = {
    width: 32,
    height: 32,
    borderRadius: "9999px",
    border: "1px solid #e5e7eb",
    background: "transparent",
    cursor: "pointer",
    color:"black",
  };

  const primaryBtnStyle = {
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "transparent",
    cursor: "pointer",
  };

  const content = (
    <div role="dialog" aria-modal="true" aria-label="Regras do Jogo">
      {/* Backdrop */}
      <div style={overlayStyle} onClick={onClose} />

      {/* Centered container */}
      <div style={containerStyle}>
        {/* Panel */}
        <div
          style={panelStyle}
          ref={panelRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={headerStyle}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
              Regras do Jogo
            </h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              title="Fechar"
              style={closeBtnStyle}
            >
              ✕
            </button>
          </div>

          {/* Body (scrollable) */}
          <div style={bodyStyle}>


            <h3>Objetivo</h3>
            <p>
              Um jogador ganha se a peça branca se deslocar para a sua casa final (quer
              seja o jogador quer seja o adversário a efetuar o movimento) ou se for
              capaz de bloquear o adversário, impedindo-o de jogar.
            </p>

            <h3>Regras</h3>
            <p>Cada jogador, alternadamente, desloca a peça branca para um quadrado
            vazio adjacente (vertical, horizontal ou diagonalmente). A casa onde se
            encontrava a peça branca recebe uma peça negra. As casas que recebem
            peças negras não podem ser ocupadas pela peça branca.
            O jogo começa com a peça branca na casa e5 (para o tabuleiro 7x7)
            </p>

            <h3>Configuração</h3>
            <ol>
              <li>Escolha o modo: Humano vs Humano, Humano vs IA, etc.</li>
              <li>Defina o tamanho do tabuleiro.</li>
              <li>Defina o nível de dificuldade.</li>
            </ol>

            <h3>Condições de Vitória</h3>
            <ul>
              <li>Vence quem atingir a sua casa‑alvo.</li>
              <li>Ou se o oponente ficar sem movimentos válidos.</li>
              <li>É importante notar que mesmo que seja o adversário a mover a peça para
                a casa final do jogador, o jogo termina com a vitória do jogador.</li>
            </ul>

          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <button onClick={onClose} style={primaryBtnStyle}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
