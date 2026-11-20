import { pathToFileURL } from "node:url";
import { createBattleStateSink, createSeededRng, createTurnManager, selectSkillTargets } from "../src/index.js";

export function runDemo(seed = 42) {
  const player = { id: "player-1", state: "ready" };
  const opponent = { id: "opponent-1", state: "ready" };
  const state = {
    turn: "PLAYER",
    turnQueue: [],
    match: { round: 1, scores: [0, 0], status: "PLAYING" },
    hands: { player: [player], ai: [opponent] },
  };
  const events = [];
  const stateSink = createBattleStateSink(state);
  const turns = createTurnManager({
    state,
    stateSink,
    emit: (type, payload) => events.push({ type, ...payload }),
    pushLog: stateSink.pushLog,
    needsRecover: () => false,
  });
  const [target] = selectSkillTargets({
    state,
    caster: player,
    casterSide: "player",
    targetType: "enemy",
  });
  const rng = createSeededRng(seed);
  if (rng() < 0.75) {
    stateSink.updateUnit("ai", target.id, { state: "defeated" });
    turns.checkRoundEndAfterAttack("player");
  } else {
    turns.advanceTurn("player");
  }
  return { events, score: state.match.scores, winner: state.match.winner ?? null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(runDemo(), null, 2));
}
