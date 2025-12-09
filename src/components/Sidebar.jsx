// components/Sidebar.jsx
import React, { useEffect } from "react";
import Sound from "../utils/soundManager";

export default function Sidebar({ open, onClose, width = 280, children }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 640;
  const panelWidth = isMobile ? "100vw" : width;
  const panelMaxWidth = isMobile ? "100vw" : "90vw";
  // Lock body scroll when open
  useEffect(() => {
    Sound.play("sidebar");
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

  // Inline styles 
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
    width: panelWidth,
    maxWidth: panelMaxWidth,
    background: "#fff",
    borderRight: "1px solid #e7e7e7",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    transform: open ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 220ms ease",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
  };

  const innerStyle = {
    padding: isMobile ? 20 : 16,
    overflow: "auto",
    height: "100%",
    fontSize: isMobile ? "1.05rem" : "1rem",
    lineHeight: isMobile ? 1.5 : 1.4,
  };
  const closeBtnStyle = {
    position: "absolute",
    top: 8,
    right: 8,
    border: "none",
    background: "black",
    fontSize: 22,
    cursor: "pointer",
    lineHeight: 1,
    opacity: isMobile ? 1 : 0,
  };

  return (
    <>
      {/* Overlay (click to close) */}
      <div
        role="presentation"
        style={overlayStyle}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Sidebar panel */}
      <aside style={asideStyle} aria-hidden={!open} aria-label="Sidebar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={closeBtnStyle}
        >
          ►
        </button>
        <div style={innerStyle}>{children}</div>
      </aside>
    </>
  );
}
