// components/Sidebar.jsx
import React, { useEffect } from "react";
import Sound from "../utils/soundManager";


export default function Sidebar({ open, onClose, width = 280, children }) {
  // Lock body scroll when open
  useEffect(() => {
    Sound.play("sidebar")
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Inline styles (bulletproof)
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: "opacity 200ms ease",
    zIndex: 999,
  };

  const asideStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    height: "100dvh",
    width,
    maxWidth: "90vw",
    background: "#fff",
    borderRight: "1px solid #e7e7e7",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    transform: open ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 220ms ease",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
  };

  const innerStyle = { padding: 16, overflow: "auto", height: "100%" };
  const closeBtnStyle = {
    position: "absolute",
    top: 8,
    right: 8,
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer",
    lineHeight: 1,
  };

  return (
    <>
      {/* Overlay (click to close) */}
      <div role="presentation" style={overlayStyle} onClick={onClose} aria-hidden={!open} />

      {/* Sidebar panel */}
      <aside style={asideStyle} aria-hidden={!open} aria-label="Sidebar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={closeBtnStyle}
        >
          ×
        </button>
        <div style={innerStyle}>{children}</div>
      </aside>
    </>
  );
}
