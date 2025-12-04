import React, { createContext, useContext, useMemo, useReducer } from "react";
import { gameReducer, initialState } from "../state/gameReducer";
import { useGameEngine } from "../hooks/useGameEngine";

// Provider simples: mantém reducer e expõe engine + estado via contexto
const GameEngineContext = createContext(null);

export function GameEngineProvider({ children, uiRefs }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const engine = useGameEngine(state, dispatch, uiRefs);

  const value = useMemo(() => ({ state, dispatch, ...engine }), [engine, state]);

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
}

export function useGameEngineContext() {
  const ctx = useContext(GameEngineContext);
  if (!ctx) {
    throw new Error("useGameEngineContext deve ser usado dentro de GameEngineProvider");
  }
  return ctx;
}
