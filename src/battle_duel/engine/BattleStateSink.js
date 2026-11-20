const updateUnitList = (units, unitId, updates) =>
  units.map((unit) => (unit.id === unitId ? { ...unit, ...updates } : unit));

export const createBattleStateSink = (runtimeState, delegate = {}) => {
  const callDelegate = (name, ...args) => {
    const fn = delegate?.[name];
    if (typeof fn === "function") {
      return fn(...args);
    }
    return undefined;
  };

  const ensureLogItem = (message, type = "normal", indent = 0) => {
    if (!runtimeState.log) {
      runtimeState.log = [];
    }
    runtimeState.log.unshift({ text: message, type, indent });
  };

  return {
    setRoundSummary(summary) {
      callDelegate("setRoundSummary", summary);
      runtimeState.match.roundSummary = summary ? { ...summary } : null;
    },
    setHands({ player, ai }) {
      callDelegate("setHands", { player, ai });
      if (player !== undefined) runtimeState.hands.player = player;
      if (ai !== undefined) runtimeState.hands.ai = ai;
    },
    setQiDecks({ player, ai }) {
      callDelegate("setQiDecks", { player, ai });
      if (player !== undefined) runtimeState.qiDecks.player = player;
      if (ai !== undefined) runtimeState.qiDecks.ai = ai;
    },
    setMatchScores(scores) {
      callDelegate("setMatchScores", scores);
      runtimeState.match.scores = [...scores];
    },
    addRoundResult(winnerSide) {
      callDelegate("addRoundResult", winnerSide);
      if (!Array.isArray(runtimeState.match.roundHistory)) {
        runtimeState.match.roundHistory = [];
      }
      runtimeState.match.roundHistory.push(winnerSide);
    },
    setMatchWinner(winnerSide) {
      callDelegate("setMatchWinner", winnerSide);
      runtimeState.match.winner = winnerSide;
    },
    setMatchStatus(status) {
      callDelegate("setMatchStatus", status);
      runtimeState.match.status = status;
    },
    setMatchRound(round) {
      callDelegate("setMatchRound", round);
      runtimeState.match.round = round;
    },
    setPhase(phase) {
      callDelegate("setPhase", phase);
      runtimeState.phase = phase;
    },
    setTurn(turn) {
      callDelegate("setTurn", turn);
      runtimeState.turn = turn;
    },
    setTurnQueue(queue) {
      callDelegate("setTurnQueue", queue);
      runtimeState.turnQueue = Array.isArray(queue) ? [...queue] : [];
    },
    shiftTurnQueue() {
      const delegated = callDelegate("shiftTurnQueue");
      if (delegated !== undefined) {
        return delegated;
      }
      return runtimeState.turnQueue.shift();
    },
    setBattlefield(location, entries) {
      callDelegate("setBattlefield", location, entries);
      if (runtimeState.battlefield?.[location] !== undefined) {
        runtimeState.battlefield[location] = Array.isArray(entries) ? [...entries] : entries;
      }
    },
    updateUnit(side, unitId, updates) {
      callDelegate("updateUnit", side, unitId, updates);
      if (side === "player") {
        runtimeState.hands.player = updateUnitList(runtimeState.hands.player, unitId, updates);
      } else if (side === "ai") {
        runtimeState.hands.ai = updateUnitList(runtimeState.hands.ai, unitId, updates);
      }
    },
    pushLog(message, type = "normal", indent = 0) {
      callDelegate("pushLog", message, type, indent);
      ensureLogItem(message, type, indent);
    },
    setLastActor(unit, side) {
      callDelegate("setLastActor", unit, side);
      if (!runtimeState.skillState) {
        runtimeState.skillState = {};
      }
      if (!runtimeState.skillState.lastActorBySide) {
        runtimeState.skillState.lastActorBySide = { player: null, ai: null };
      }
      runtimeState.skillState.lastActorSkillId = unit?.skillId || null;
      runtimeState.skillState.lastActorId = unit?.id || null;
      if (side === "player" || side === "ai") {
        runtimeState.skillState.lastActorBySide[side] = unit
          ? { id: unit.id, skillId: unit.skillId }
          : null;
      }
    },
    addTaunt(targetId, taunterId) {
      callDelegate("addTaunt", targetId, taunterId);
      if (!runtimeState.skillState.tauntedBy) {
        runtimeState.skillState.tauntedBy = {};
      }
      runtimeState.skillState.tauntedBy[targetId] = taunterId;
    },
    clearTaunt(taunterId) {
      callDelegate("clearTaunt", taunterId);
      if (!runtimeState.skillState.tauntedBy) {
        return;
      }
      Object.keys(runtimeState.skillState.tauntedBy).forEach((targetId) => {
        if (runtimeState.skillState.tauntedBy[targetId] === taunterId) {
          delete runtimeState.skillState.tauntedBy[targetId];
        }
      });
    },
    useIronShell(unitId) {
      callDelegate("useIronShell", unitId);
      if (!runtimeState.skillState.ironShellUsed) {
        runtimeState.skillState.ironShellUsed = {};
      }
      runtimeState.skillState.ironShellUsed[unitId] = true;
    },
    addSwapBuff(unitId) {
      callDelegate("addSwapBuff", unitId);
      if (!runtimeState.skillState.swapBuff) {
        runtimeState.skillState.swapBuff = {};
      }
      runtimeState.skillState.swapBuff[unitId] = true;
    },
  };
};
