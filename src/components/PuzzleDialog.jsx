import React from "react";

// Dialogo para feedback de resolução de problemas
export function PuzzleDialog({
  open,
  problemState,
  getBestMovesForPuzzle,
  onClose,
  onRetry,
  onNext,
}) {
  if (!open || !problemState?.current) return null;

  const p = problemState.current;
  const used = problemState.movesMade ?? 0;
  const best = getBestMovesForPuzzle(p);
  const optimal = typeof best === "number" && used === best;

  if (problemState.status === "failed") {
    return (
      <div className="winner-message">
        <h2>Não conseguiste resolver este problema!</h2>
        <h2>Tenta outra vez!</h2>
        <p>
          {typeof best === "number" ? (
            <>
              Solução mínima: <strong>{best}</strong> jogadas.
            </>
          ) : (
            <>Tenta novamente.</>
          )}
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
            justifyContent: "center",
          }}
        >
          <button onClick={onClose}>Fechar</button>
          <button onClick={onRetry}>Tentar de novo</button>
        </div>
      </div>
    );
  }

  if (optimal) {
    return (
      <div className="winner-message">
        <h2>Parabéns! Encontraste a melhor solução.</h2>
        <p>
          Conseguiste em <strong>{used}</strong> jogadas, que é o mínimo.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 8,
            justifyContent: "center",
          }}
        >
          <button onClick={onClose}>Fechar</button>
          <button onClick={onNext}>Outro problema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="winner-message">
      <h2>Resolveste, mas não é a melhor solução!</h2>
      <p>
        Usaste <strong>{used}</strong> jogadas.
        {typeof best === "number" ? (
          <>
            {" "}
            Melhor solução: <strong>{best}</strong>.
          </>
        ) : null}
      </p>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 8,
          justifyContent: "center",
        }}
      >
        <button onClick={onClose}>Fechar</button>
        <button onClick={onRetry}>Tentar de novo</button>
      </div>
    </div>
  );
}
