import assert from "node:assert/strict";
import test from "node:test";
import { createBattleStateSink, createTurnManager, EventType, selectSkillTargets, stepSettlementProgress } from "../src/index.js";
import { runDemo } from "../examples/duel.js";

test("sample duel runs deterministically and ends with a match event", () => {
  const result = runDemo();
  assert.deepEqual(result, runDemo());
  assert.equal(result.winner, "player");
  assert.deepEqual(result.score, [1, 0]);
  assert.equal(result.events[0].type, EventType.MATCH_END);
});

test("turn advancement takes a queued turn before alternating sides", () => {
  const state = { turn: "PLAYER", turnQueue: ["PLAYER"], hands: { player: [], ai: [] } };
  const events = [];
  const manager = createTurnManager({
    state,
    stateSink: createBattleStateSink(state),
    needsRecover: () => false,
    emit: (type) => events.push(type),
  });
  manager.advanceTurn("player");
  assert.equal(state.turn, "PLAYER");
  assert.deepEqual(state.turnQueue, []);
  assert.deepEqual(events, [EventType.TURN_CHANGE]);

  manager.advanceTurn("player");
  assert.equal(state.turn, "AI");
  assert.equal(events.at(-1), EventType.AI_TURN);
});

test("target resolution skips defeated enemies and preserves the input", () => {
  const caster = { id: "p", state: "ready" };
  const active = { id: "active", state: "ready" };
  const state = {
    hands: { player: [caster], ai: [{ id: "defeated", state: "defeated" }, active] },
  };
  const targets = selectSkillTargets({ state, caster, casterSide: "player", targetType: "all_enemies" });
  assert.deepEqual(targets, [{ ...active, __targetSide: "ai" }]);
  assert.equal(active.__targetSide, undefined);
});

test("settlement progresses through the score display before the next round", () => {
  const started = stepSettlementProgress({ status: "ROUND_END", now: 100, startedAt: null });
  assert.equal(started.phase, "from");
  const scored = stepSettlementProgress({ status: "ROUND_END", now: 1100, ...started });
  assert.equal(scored.phase, "to");
  assert.equal(scored.shouldStartNextRound, false);
  const ended = stepSettlementProgress({ status: "ROUND_END", now: 2100, ...scored });
  assert.equal(ended.shouldStartNextRound, true);
});
