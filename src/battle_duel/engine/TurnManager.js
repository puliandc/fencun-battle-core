import { EventType } from "../../events.js";

export const createTurnManager = (context = {}) => {
  const {
    state,
    stateSink,
    emit,
    pushLog,
    rng,
    needsRecover,
    dealQiCards,
    executeTriggeredSkillsForSide,
    clearUntilActionEffectsForDeadOwners,
    clearPrevAllyActorMarksIfCrossRound,
  } = context;

  const setRoundSummary = (summary) => {
    if (summary) {
      emit(EventType.ROUND_SUMMARY, { summary });
    }
    if (stateSink?.setRoundSummary) {
      stateSink.setRoundSummary(summary);
    }
  };

  const endRound = (winnerSide) => {
    const previousScores = [...state.match.scores];
    const nextScores = [...state.match.scores];
    if (winnerSide === "player") {
      nextScores[0] += 1;
    } else {
      nextScores[1] += 1;
    }
    stateSink.setMatchScores(nextScores);
    stateSink.addRoundResult(winnerSide);
    pushLog(`本局胜者：${winnerSide === "player" ? "玩家" : "对手"}`);

    // 单局制：1:0 即结束
    if (nextScores[0] >= 1 || nextScores[1] >= 1) {
      emit(EventType.MATCH_END, { winner: winnerSide, scores: nextScores });
      stateSink.setMatchWinner(winnerSide);
      stateSink.setMatchStatus("END");
      setRoundSummary(null);
      pushLog("切磋结束。");
      return;
    }

    setRoundSummary({
      round: state.match.round,
      winner: winnerSide,
      from: previousScores,
      to: nextScores,
    });
    emit(EventType.ROUND_END, { winner: winnerSide, round: state.match.round, scores: nextScores });
    stateSink.setMatchStatus("ROUND_END");
    pushLog("进入局间休息。");
  };

  const handleQiLoss = (loserSide) => {
    const winner = loserSide === "player" ? "ai" : "player";
    emit(EventType.QI_EXHAUSTED, { side: loserSide });
    pushLog(`内力枯竭（卡牌不足），${loserSide === "player" ? "玩家" : "对手"}无法为所有侠客分配内力，判定败北。`);
    endRound(winner);
  };

  const applyReloadIfNeeded = (side) => {
    const units = side === "player" ? state.hands.player : state.hands.ai;
    if (!needsRecover(units)) {
      return true;
    }
    const qiState = side === "player" ? state.qiDecks.player : state.qiDecks.ai;
    const result = dealQiCards(units, qiState, rng);
    if (result.exhausted) {
      handleQiLoss(side);
      return false;
    }
    if (side === "player") {
      stateSink.setHands({ player: result.units });
      stateSink.setQiDecks({ player: result.qiState });
    } else {
      stateSink.setHands({ ai: result.units });
      stateSink.setQiDecks({ ai: result.qiState });
    }

    const reloadedUnitIds = result.units
      .filter((unit) => unit.qiCard !== null)
      .map((unit) => unit.id);

    emit(EventType.RELOAD_TRIGGERED, { side, unitIds: reloadedUnitIds });
    pushLog(`${side === "player" ? "玩家" : "对手"} 重新调息。`);

    if (typeof executeTriggeredSkillsForSide === "function") {
      executeTriggeredSkillsForSide({
        side,
        trigger: "on_reload",
        runtimeContext: {
          side,
          unitIds: reloadedUnitIds,
        },
      });
    }
    return true;
  };

  const checkRoundEndAfterAttack = (attackerSide) => {
    const playerAlive = state.hands.player.filter((unit) => unit.state !== "defeated").length;
    const aiAlive = state.hands.ai.filter((unit) => unit.state !== "defeated").length;
    if (playerAlive === 0 && aiAlive === 0) {
      const winner = attackerSide === "player" ? "ai" : "player";
      endRound(winner);
      return true;
    }
    if (playerAlive === 0) {
      endRound("ai");
      return true;
    }
    if (aiAlive === 0) {
      endRound("player");
      return true;
    }
    return false;
  };

  const advanceTurn = (attackerSide) => {
    if (typeof clearPrevAllyActorMarksIfCrossRound === "function") {
      clearPrevAllyActorMarksIfCrossRound(attackerSide);
    }
    if (typeof clearUntilActionEffectsForDeadOwners === "function") {
      clearUntilActionEffectsForDeadOwners();
    }

    let nextTurn = attackerSide === "player" ? "AI" : "PLAYER";
    const queued = stateSink.shiftTurnQueue();
    if (queued) {
      nextTurn = queued;
    }
    stateSink.setTurn(nextTurn);
    emit(EventType.TURN_CHANGE, { turn: nextTurn });

    const isPlayerTurn = nextTurn === "PLAYER";
    const continueBattle = applyReloadIfNeeded(isPlayerTurn ? "player" : "ai");
    if (!continueBattle) {
      return;
    }
    if (nextTurn === "AI") {
      emit(EventType.AI_TURN, {});
    }
  };

  const startNextRound = () => {
    if (state.skillState?.prevAllyActorTempMarks) {
      state.skillState.prevAllyActorTempMarks = { player: {}, ai: {} };
    }
    if (state.skillState?.untilActionEffects) {
      state.skillState.untilActionEffects = {};
    }

    stateSink.setMatchRound(state.match.round + 1);
    stateSink.setMatchStatus("SELECTING");
    stateSink.setPhase("Deploy");
    stateSink.setTurn("AI");
    stateSink.setTurnQueue([]);
    stateSink.setHands({ player: [], ai: [] });
    stateSink.setQiDecks({ player: { deck: [], discard: [] }, ai: { deck: [], discard: [] } });
    stateSink.setBattlefield("rooftop", []);
    stateSink.setBattlefield("building", []);
    stateSink.setBattlefield("street", []);
    setRoundSummary(null);
    emit(EventType.ROUND_RESET, {});
    pushLog("下一场切磋开始，请重新挑选侠客。");
  };

  return {
    handleQiLoss,
    applyReloadIfNeeded,
    endRound,
    checkRoundEndAfterAttack,
    advanceTurn,
    startNextRound,
  };
};
