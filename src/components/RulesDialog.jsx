import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function RulesDialog({ open, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      className="rb-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Regras do Jogo"
      onClick={onClose}                 // click fora do quadro fecha diálogo
    >
      <div
        className="rb-modal"
        onClick={(e) => e.stopPropagation()} // prevenir que feche ao clicar dentro
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="rb-modal-header">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Regras do Jogo</h2>
          <button className="rb-icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </header>

        <section className="rb-modal-section">
          <h3 className="rb-text">Objetivo</h3>
          <p className="rb-text">
            Um jogador ganha se a peça branca se deslocar para a sua casa final
            (quer seja o jogador quer seja o adversário a efetuar o movimento) ou
            se for capaz de bloquear o adversário, impedindo-o de jogar.
          </p>

          <h3 className="rb-text">Regras</h3>
          <p className="rb-text">
            Cada jogador, alternadamente, desloca a peça branca para um quadrado
            vazio adjacente (vertical, horizontal ou diagonalmente). A casa onde
            se encontrava a peça branca recebe uma peça negra. As casas que
            recebem peças negras não podem ser ocupadas pela peça branca. O jogo
            começa com a peça branca na casa e5 (para o tabuleiro 7x7).
          </p>

          <h3 className="rb-text">Configuração</h3>
          <p>Na barra lateral:</p>
          <ol className="rb-text">
            <li>Escolhe o modo: Humano vs Humano, Humano vs IA, etc.</li>
            <li>Define o tamanho do tabuleiro.</li>
            <li>Define o nível de dificuldade.</li>
            <li>Volta ao tabuleiro e clica em Iniciar</li>
          </ol>

          <h3 className="rb-text">Condições de Vitória</h3>
          <ul className="rb-text">
            <li>Vence quem atingir a sua casa objetivo.</li>
            <li>Ou se o oponente ficar sem movimentos válidos.</li>
            <li>Mesmo que seja o adversário a mover a peça para a tua casa final, a vitória é tua, e vice-versa.</li>
          </ul>
        </section>

        <footer className="rb-modal-footer">
          <button className="rb-btn" onClick={onClose}>Fechar</button>
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
