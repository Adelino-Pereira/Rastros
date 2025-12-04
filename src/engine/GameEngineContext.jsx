import React, { createContext, useContext, useMemo, useReducer } from "react";
import { gameReducer, initialState } from "../state/gameReducer";
import { useGameEngine } from "../hooks/useGameEngine";

// Provider simples: mantém reducer e expõe engine + estado via contexto
// responsável por partilhar o estado global do jogo
const GameEngineContext = createContext(null);

export function GameEngineProvider({ children, uiRefs }) {
  // toda a lógica de alteração de estado em gameReducer
  const [state, dispatch] = useReducer(gameReducer, initialState);
  // funções para iniciar jogo, processar jogadas, lidar com puzzles, etc.
  const engine = useGameEngine(state, dispatch, uiRefs);

  // useMemo evita recriar o objeto de contexto em cada render
  // reduz renders em cascata nos componentes
  const value = useMemo(
    () => ({ state, dispatch, ...engine }),
    [engine, state]
  );

  return (
    <GameEngineContext.Provider value={value}>
      {children}
    </GameEngineContext.Provider>
  );
}

// Hook de conveniência para consumir o contexto do motor de jogo.
// garante que só é usado dentro de <GameEngineProvider>.
export function useGameEngineContext() {
  const ctx = useContext(GameEngineContext);
  if (!ctx) {
    throw new Error(
      "useGameEngineContext deve ser usado dentro de GameEngineProvider"
    );
  }
  return ctx;
}
