import { useCallback } from "react";
import {
  convertGrid,
  convertValidMoves,
  convertMarker,
} from "../utils/wasmConverters";
import { preparePuzzleGame } from "../utils/puzzleService";
import problems from "../data/problems.json";
import { applyPuzzleToEngine } from "../utils/applyPuzzleToEngine";
import Sound from "../utils/soundManager";
import { getFirstMoveAI } from "../utils/getFirstMoveAI";

// Helpers puros para converter estado do WASM
// Constrói grid e jogadas válidas a partir do board WASM (versão pura)
const buildGridAndMovesPure = (board, rows, cols) => {
  const grid = convertGrid(board.getFlatGrid(), rows, cols);
  const rawMoves =
    typeof board.getFlatValidMoves === "function"
      ? board.getFlatValidMoves()
      : board.getValidMoves();
  const validMoves = convertValidMoves(rawMoves);
  return { grid, validMoves };
};

// Conta células bloqueadas (0) num board convertido em grid simples
const countBlockedPure = (board, rows, cols) => {
  const flat = convertGrid(board.getFlatGrid(), rows, cols);
  return flat.filter((cell) => cell === 0).length;
};

// Calcula quem joga pela paridade de blocos: ímpar -> P1, par -> P2
const whoMovesFromParityPure = (blockedCount) => {
  console.log("blockedCount", blockedCount);
  const totalMarkers = blockedCount + 1; // +1 para o marcador branco
  return totalMarkers % 2 === 1 ? 1 : 2; // ímpar -> P1, par -> P2
};

const pairMoves = (moves) => {
  const rounds = [];
  for (let i = 0; i < moves.length; i++) {
    const r = Math.floor(i / 2);
    if (!rounds[r]) rounds[r] = [null, null];
    const side = i % 2 === 0 ? 0 : 1; // primeiro índice é P1, segundo P2
    rounds[r][side] = moves[i];
  }
  return rounds;
};

const countPreMovesFromPuzzlePure = (p) => {
  const [mr, mc] = p.marker;
  return (p.blocked || []).filter(([r, c]) => !(r === mr && c === mc)).length;
};

const buildInitialMoveLogFromPuzzlePure = (p) => {
  const blocked = (p.blocked || []).filter(
    ([r, c]) => !(r === p.marker[0] && c === p.marker[1])
  );

  if (blocked.length === 0) return [];

  const dests = blocked.slice(1);
  dests.push([p.marker[0], p.marker[1]]);

  return pairMoves(dests);
};

// Calcula a profundidade a usar para a jogada da IA
const computeDepth = ({
  state,
  forceMove,
  currentPlayer,
  round,
  startDepth,
  maxDepth,
}) => {
  // Board grande em AI vs AI → limitar profundidade
  const largeBoardAIvsAI =
    (state.rows >= 9 || state.cols >= 9) && state.mode === "ai_vs_ai";
  const veryLargeBoard = state.rows >= 10 || state.cols >= 10;

  if (!forceMove && (largeBoardAIvsAI || veryLargeBoard)) {
    return 7;
  }

  // Ajuste do nível de dificuldade
  if (!forceMove && state.problem?.status === "idle") {
    const d = state.difficulty;
    if (d === 1) return 1;
    if (d === 2) return 1;
    if (d === 3) return 3;
    if (d === 4) return 3;
    if (d === 5) return 4;
    if (d === 6) return computeDepthWithRounds(4, 6, round);
    if (d === 7) return 6;
    if (d === 8) return 7;
    if (d === 9) return computeDepthWithRounds(5, 9, round);
  }

  return computeDepthWithRounds(startDepth, maxDepth, round);
};

const computeDepthWithRounds = (startDepth, maxDepth, round) => {
  // Incrementa com as rondas, força profundidade ímpar e respeita limites
  let depth = Math.min(startDepth + Math.floor(round / 5), maxDepth);
  depth = depth % 2 === 0 ? depth - 1 : depth;
  depth = Math.max(depth, startDepth);
  return depth;
};

const makeAi = ({
  wasm,
  isMax,
  depth,
  level,
  debug = 0,
  shuffleTiesOnly = false,
  orderingPolicy = null,
}) => {
  // Fábrica centralizada de IA para manter criação consistente no frontend
  const ai = wasm?.createAIWithLevel(isMax, depth, level, debug);
  if (!ai) return ai;

  // Aplica políticas de ordenação se existirem no módulo WASM
  if (orderingPolicy?.ShuffleAll && ai?.setOrderingPolicy) {
    ai.setOrderingPolicy(orderingPolicy.ShuffleAll);
  }
  // Ajusta flag de baralhar apenas empates quando desejado
  if (ai?.setShuffleTiesOnly && shuffleTiesOnly) {
    ai.setShuffleTiesOnly(true);
  }

  return ai;
};

export function useGameEngine(state, dispatch, uiRefs) {
  const {
    setPuzzleDialogOpen,
    setAiMoveWarnOpen,
    aiMoveDontWarnAgain,
    setAiMoveDontWarnAgain,
  } = uiRefs;

  const buildGridAndMoves = useCallback(
    (board) => buildGridAndMovesPure(board, state.rows, state.cols),
    [state.rows, state.cols]
  );

  const countBlocked = useCallback(
    (board) => countBlockedPure(board, state.rows, state.cols),
    [state.rows, state.cols]
  );

  const whoMovesFromParity = useCallback(
    (blockedCount) => whoMovesFromParityPure(blockedCount),
    []
  );

  const handleStartGame = useCallback(() => {
    const { wasm, maxDepth, difficulty } = state;
    if (!wasm) return;

    // Sair de puzzles, fechar diálogo e criar board/IA
    dispatch({ type: "PROBLEM_CLEAR" });
    setPuzzleDialogOpen(false);

    const board = new wasm.Board(state.rows, state.cols); // instância limpa para novo jogo
    const shuffletiesFlag = true;
    const orderingPolicy = state.wasm?.OrderingPolicy;

    // Cria IA com política/flags
    const ai1 = makeAi({
      wasm,
      isMax: true,
      depth: maxDepth,
      level: difficulty,
      debug: 2,
      shuffleTiesOnly: shuffletiesFlag,
      orderingPolicy: orderingPolicy?.Deterministic,
    });
    const ai2 = makeAi({
      wasm,
      isMax: false,
      depth: maxDepth,
      level: difficulty,
      debug: 2,
      shuffleTiesOnly: shuffletiesFlag,
      orderingPolicy: orderingPolicy?.Deterministic,
    });

    const grid = convertGrid(board.getFlatGrid(), state.rows, state.cols);
    const validMoves = convertValidMoves(board.getFlatValidMoves());
    const marker =
      typeof board.getFlatMarker === "function"
        ? convertMarker(board.getFlatMarker())
        : convertMarker(board.getMarker());

    dispatch({
      type: "INIT_GAME",
      payload: {
        board,
        ai1,
        ai2,
        grid,
        marker,
        validMoves,
      },
    });
  }, [dispatch, setPuzzleDialogOpen, state]);

  // Determina se o turno atual pertence a alguma IA conforme o modo
  const isAiTurn = useCallback(() => {
    const { mode, currentPlayer } = state;
    if (mode === "human_vs_human") return false;
    if (mode === "human_first" && currentPlayer === 1) return true;
    if (mode === "ai_first" && currentPlayer === 0) return true;
    if (mode === "ai_vs_ai") return true;
    return false;
  }, [state]);

  // Fecha o turno: deteta estado terminal ou avança para próximo jogador
  const endTurn = useCallback(() => {
    const { board } = state;

    if (board.isTerminal()) {
      dispatch({ type: "SET_WINNER", payload: board.getWinner() });

      if (
        (state.mode === "human_first" &&
          (board.getWinner() === 1 || board.getWinner() === 3)) ||
        (state.mode === "ai_first" &&
          (board.getWinner() === 2 || board.getWinner() === 6)) ||
        state.mode === "human_vs_human"
      ) {
        Sound.play("win");
      }
      if (
        (state.mode === "human_first" &&
          (board.getWinner() === 2 || board.getWinner() === 6)) ||
        (state.mode === "ai_first" &&
          (board.getWinner() === 1 || board.getWinner() === 3))
      ) {
        Sound.play("lose");
      }
    } else {
      dispatch({ type: "END_TURN" });
    }
  }, [dispatch, state]);

  const handleAiTurn = useCallback(
    (forceMove = false) => {
      // Se já terminou, não deixa IA jogar de novo (evita jogada extra em jogos rápidos)
      if (state.board.isTerminal() || state.winner) return;

      Sound.play("move");
      const { board, ai1, ai2, currentPlayer, round, startDepth, maxDepth } =
        state;

      // Seleciona IA e profundidade para esta jogada (pode ser forçada via botão)
      let ai = currentPlayer === 0 ? ai1 : ai2;
      let depth = computeDepth({
        state,
        forceMove,
        currentPlayer,
        round,
        startDepth,
        maxDepth,
      });

      if (forceMove) {
        if (!state.gameStarted || state.winner || isAiTurn()) return; // botão manual ignora se jogo acabado ou turno da IA
        if (state.rows >= 9 || state.rows >= 9) {
          depth = 8; // tabuleiros grandes mantêm profundidade fixa ao forçar
        } else {
          depth = computeDepthWithRounds(startDepth, maxDepth, round);
        }

        ai = makeAi({
          wasm: state.wasm,
          isMax: currentPlayer === 0,
          depth,
          level: 10,
          debug: 1,
        });
      } else if (!ai) {
        const levelForThisMove = forceMove ? 10 : state.difficulty; // fallback para IA ainda não criada

        ai = makeAi({
          wasm: state.wasm,
          isMax: currentPlayer === 0,
          depth: state.maxDepth, // usa profundidade padrão ao criar IA on-the-fly
          level: levelForThisMove,
          debug: 0,
        });
      }

      const move = ai.chooseMove(board, depth, round);

      // Aplica jogada da IA e atualiza estado derivado
      board.makeMove(move);
      dispatch({ type: "APPLY_MOVE", payload: { move } });
      dispatch({ type: "UPDATE_STATE" });
      dispatch({ type: "INCREMENT_ROUND" });

      setTimeout(() => {
        endTurn();
      }, 50);
      // Reaplica dificuldade no state (protege casos de forçar nível)
      dispatch({ type: "SET_DIFFICULTY", payload: state.difficulty });
    },
    [dispatch, endTurn, isAiTurn, state]
  );

  // Clique humano numa célula: valida, aplica movimento e avalia puzzles
  const handleCellClick = useCallback(
    (r, c) => {
      const { board, validMoves, winner } = state;

      if (!state.gameStarted || winner || isAiTurn()) return; // ignora cliques fora do contexto de jogo

      const valid = validMoves.some(([vr, vc]) => vr === r && vc === c);
      if (!valid) return; // proteção extra caso UI permita clicar numa casa inválida

      board.makeMove([r, c]);
      Sound.play("move");
      dispatch({ type: "APPLY_MOVE", payload: { move: [r, c] } });
      dispatch({ type: "UPDATE_STATE" });
      dispatch({ type: "INCREMENT_ROUND" });

      if (state.problem?.status === "active") {
        const nextMoves = (state.problem?.movesMade ?? 0) + 1;
        dispatch({ type: "PROBLEM_MOVE" });
        evaluateProblemAfterMove(nextMoves);
      }

      endTurn();
    },
    [dispatch, endTurn, isAiTurn, state]
  );

  const evaluateProblemAfterMove = useCallback(
    (nextMovesMade) => {
      if (state.problem?.status !== "active" || !state.problem?.current) return;

      if (state.board.isTerminal()) {
        dispatch({ type: "PROBLEM_SET_STATUS", payload: "success" });
      }
    },
    [dispatch, state.board, state.problem]
  );

  const startRandomProblem = useCallback(() => {
    const { wasm } = state;
    if (!wasm) return;
    setPuzzleDialogOpen(false);

    const p = problems[Math.floor(Math.random() * problems.length)]; // seleciona puzzle aleatório da lista
    const prepared = preparePuzzleGame({
      puzzle: p,
      wasm,
      makeAi,
      maxDepth: 11, // puzzles usam profundidade máxima fixa
      difficulty: 10,
      buildGridAndMoves: (b) =>
        buildGridAndMovesPure(b, state.rows, state.cols),
      countBlocked: (b) => countBlockedPure(b, state.rows, state.cols),
      whoMovesFromParity: whoMovesFromParityPure,
      buildInitialMoveLog: buildInitialMoveLogFromPuzzlePure,
      countPreMoves: countPreMovesFromPuzzlePure,
    });
    if (!prepared) return;

    dispatch({
      type: "INIT_GAME",
      payload: {
        board: prepared.board,
        ai1: prepared.ai1,
        ai2: prepared.ai2,
        grid: prepared.grid,
        marker: prepared.marker,
        validMoves: prepared.validMoves,
        mode: prepared.mode,
        currentPlayer: prepared.currentPlayerIdx,
        moveLog: prepared.moveLog,
        round: prepared.round,
      },
    });
    dispatch({ type: "UPDATE_STATE" });
    dispatch({ type: "PROBLEM_START", payload: p });

    if (typeof uiRefs.closeSidebarIfMobile === "function")
      uiRefs.closeSidebarIfMobile();
  }, [
    buildGridAndMovesPure,
    countBlockedPure,
    dispatch,
    setPuzzleDialogOpen,
    state,
    uiRefs,
    whoMovesFromParityPure,
  ]);

  const resetProblem = useCallback(() => {
    const { wasm, problem } = state;
    if (!wasm || !problem?.current) return;
    setPuzzleDialogOpen(false);

    const prepared = preparePuzzleGame({
      puzzle: problem.current,
      wasm,
      makeAi,
      maxDepth: state.maxDepth,
      difficulty: state.difficulty,
      buildGridAndMoves: (b) =>
        buildGridAndMovesPure(b, state.rows, state.cols),
      countBlocked: (b) => countBlockedPure(b, state.rows, state.cols),
      whoMovesFromParity: whoMovesFromParityPure,
      buildInitialMoveLog: buildInitialMoveLogFromPuzzlePure,
      countPreMoves: countPreMovesFromPuzzlePure,
    });
    if (!prepared) return;

    dispatch({
      type: "INIT_GAME",
      payload: {
        board: prepared.board,
        ai1: prepared.ai1,
        ai2: prepared.ai2,
        grid: prepared.grid,
        marker: prepared.marker,
        validMoves: prepared.validMoves,
        mode: prepared.mode,
        currentPlayer: prepared.currentPlayerIdx,
        moveLog: prepared.moveLog,
        round: prepared.round,
      },
    });
    dispatch({ type: "UPDATE_STATE" });
    dispatch({ type: "PROBLEM_RESET" });
  }, [
    buildGridAndMovesPure,
    countBlockedPure,
    dispatch,
    setPuzzleDialogOpen,
    state,
    whoMovesFromParityPure,
  ]);

  const onAiMoveClick = useCallback(() => {
    const vsAI = state.mode === "human_first" || state.mode === "ai_first";
    if (!vsAI) {
      handleAiTurn(true);
      return;
    }

    const warnDisabled = localStorage.getItem("aiMoveWarnDisabled") === "1";
    if (warnDisabled) {
      dispatch({ type: "SKIP_STATS_THIS_MATCH" });
      handleAiTurn(true);
      return;
    }

    setAiMoveWarnOpen(true);
  }, [dispatch, handleAiTurn, setAiMoveWarnOpen, state.mode]);

  return {
    handleStartGame,
    handleCellClick,
    handleAiTurn,
    isAiTurn,
    endTurn,
    buildGridAndMoves,
    countBlocked,
    whoMovesFromParity,
    startRandomProblem,
    resetProblem,
    evaluateProblemAfterMove,
    onAiMoveClick,
  };
}
