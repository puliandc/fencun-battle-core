const cloneUnit = (unit = {}) => ({
  ...unit,
  buffs: Array.isArray(unit.buffs)
    ? unit.buffs.map((buff) => ({ ...buff }))
    : [],
});

const normalizeStackCount = (value, fallback = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(1, Math.floor(num));
};

const normalizeDuration = (value, fallback = 0) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.max(0, Math.floor(num));
};

const createBuffEntry = (buffDef, stacks, sourceId = null) => ({
  buffId: buffDef.id,
  stacks: normalizeStackCount(stacks, 1),
  remainingDuration: normalizeDuration(buffDef.duration, 0),
  sourceId,
});

const clampHp = (unit, hp) => {
  const maxHp = Number(unit.maxHp ?? unit.hp ?? 0);
  return Math.max(0, Math.min(maxHp, hp));
};

const resolveUnitStateAfterHpChange = (unit, hp) => {
  const maxHp = Number(unit.maxHp ?? unit.hp ?? hp);
  if (hp <= 0) {
    return "defeated";
  }
  if (hp < maxHp) {
    return "wounded";
  }
  return unit.state || "normal";
};

export const applyBuffToUnit = (unit, buffDef, { stacks = 1, sourceId = null } = {}) => {
  if (!unit || !buffDef?.id) {
    return { unit, applied: false, buff: null };
  }

  const nextUnit = cloneUnit(unit);
  const incomingStacks = normalizeStackCount(stacks, 1);
  const maxStacks = normalizeStackCount(buffDef.maxStacks, 1);
  const duration = normalizeDuration(buffDef.duration, 0);
  const stackType = String(buffDef.stackType || "UNIQUE").toUpperCase();
  const existingIndex = nextUnit.buffs.findIndex((buff) => buff.buffId === buffDef.id);
  const existing = existingIndex >= 0 ? nextUnit.buffs[existingIndex] : null;

  let appliedBuff = null;

  if (!existing) {
    appliedBuff = createBuffEntry(buffDef, Math.min(maxStacks, incomingStacks), sourceId);
    nextUnit.buffs.push(appliedBuff);
    return { unit: nextUnit, applied: true, buff: appliedBuff };
  }

  const updated = { ...existing };
  if (stackType === "ADD_VALUE") {
    updated.stacks = Math.min(maxStacks, normalizeStackCount(existing.stacks, 1) + incomingStacks);
    updated.remainingDuration = Math.max(normalizeDuration(existing.remainingDuration, 0), duration);
  } else if (stackType === "REFRESH_DURATION") {
    updated.stacks = Math.min(maxStacks, normalizeStackCount(existing.stacks, 1) + incomingStacks);
    updated.remainingDuration = duration;
  } else {
    // UNIQUE
    updated.stacks = 1;
    updated.remainingDuration = duration;
  }
  updated.sourceId = sourceId || updated.sourceId || null;

  nextUnit.buffs[existingIndex] = updated;
  appliedBuff = updated;
  return { unit: nextUnit, applied: true, buff: appliedBuff };
};

const applyTickEffect = (unit, buff, buffDef) => {
  const tickEffect = buffDef?.tickEffect;
  if (!tickEffect?.type) {
    return { unit, effect: null };
  }

  const perStack = Number(tickEffect.value ?? 0);
  const totalValue = perStack * normalizeStackCount(buff.stacks, 1);
  if (!Number.isFinite(totalValue) || totalValue === 0) {
    return { unit, effect: null };
  }

  const nextUnit = { ...unit };
  const currentHp = Number(nextUnit.hp ?? 0);
  if (tickEffect.type === "DAMAGE") {
    const nextHp = clampHp(nextUnit, currentHp - totalValue);
    nextUnit.hp = nextHp;
    nextUnit.state = resolveUnitStateAfterHpChange(nextUnit, nextHp);
    return {
      unit: nextUnit,
      effect: { type: "tick_damage", buffId: buff.buffId, amount: totalValue },
    };
  }
  if (tickEffect.type === "HEAL") {
    const nextHp = clampHp(nextUnit, currentHp + totalValue);
    nextUnit.hp = nextHp;
    nextUnit.state = resolveUnitStateAfterHpChange(nextUnit, nextHp);
    return {
      unit: nextUnit,
      effect: { type: "tick_heal", buffId: buff.buffId, amount: totalValue },
    };
  }

  return { unit, effect: null };
};

export const tickBuffsOnUnit = (unit, buffDefs = {}) => {
  if (!unit) {
    return { unit, effects: [] };
  }

  let nextUnit = cloneUnit(unit);
  const effects = [];
  const nextBuffs = [];

  nextUnit.buffs.forEach((buff) => {
    const buffDef = buffDefs[buff.buffId];
    if (!buffDef) {
      nextBuffs.push({ ...buff });
      return;
    }

    const ticked = applyTickEffect(nextUnit, buff, buffDef);
    nextUnit = ticked.unit;
    if (ticked.effect) {
      effects.push(ticked.effect);
    }

    const remainingDuration = normalizeDuration(buff.remainingDuration, 0);
    if (remainingDuration === 0) {
      nextBuffs.push({ ...buff });
      return;
    }

    const decremented = remainingDuration - 1;
    if (decremented > 0) {
      nextBuffs.push({ ...buff, remainingDuration: decremented });
    }
  });

  nextUnit.buffs = nextBuffs;
  return { unit: nextUnit, effects };
};
