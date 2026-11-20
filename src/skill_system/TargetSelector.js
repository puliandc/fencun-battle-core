const isAlive = (unit) => unit?.state !== "defeated";

const getUnitsBySide = (state, side) => {
  if (!state?.hands) {
    return [];
  }
  return side === "player" ? (state.hands.player || []) : (state.hands.ai || []);
};

const getOppositeSide = (side) => (side === "player" ? "ai" : "player");
const normalizeLocation = (location) => String(location || "").trim().toLowerCase();
const attachResolvedSide = (unit, side) => (unit ? { ...unit, __targetSide: side } : null);
const attachResolvedSideList = (units = [], side) => units.map((unit) => attachResolvedSide(unit, side)).filter(Boolean);

const pickRandom = (items = [], rng = Math.random) => {
  if (!items.length) {
    return null;
  }
  const index = Math.floor(rng() * items.length);
  return items[index] || null;
};

export const resolveTargetSide = (targetType, casterSide) => {
  if (!targetType) {
    return getOppositeSide(casterSide);
  }
  if (
    targetType === "self" ||
    targetType === "self_and_target" ||
    targetType.startsWith("ally")
  ) {
    return casterSide;
  }
  return getOppositeSide(casterSide);
};

export const selectSkillTargets = ({
  state,
  caster,
  casterSide,
  targetType,
  targetScope,
  targetIds = [],
  targetLocation = null,
  rng = Math.random,
}) => {
  if (!state || !caster || !casterSide) {
    return [];
  }

  const enemySide = getOppositeSide(casterSide);
  const ownUnits = attachResolvedSideList(getUnitsBySide(state, casterSide).filter(isAlive), casterSide);
  const enemyUnits = attachResolvedSideList(getUnitsBySide(state, enemySide).filter(isAlive), enemySide);
  const firstTargetId = targetIds[0] || null;
  const casterWithSide = attachResolvedSide(caster, casterSide);

  switch (targetType) {
    case "self":
      return casterWithSide ? [casterWithSide] : [];
    case "self_and_target": {
      const target = [...ownUnits, ...enemyUnits].find((unit) => unit.id === firstTargetId);
      return target ? [casterWithSide, target].filter(Boolean) : [casterWithSide].filter(Boolean);
    }
    case "ally":
      if (targetScope === "random_ally") {
        const candidate = pickRandom(
          ownUnits.filter((unit) => unit.id !== caster.id),
          rng,
        );
        return candidate ? [candidate] : [];
      }
      if (targetScope === "random_qi_card") {
        const candidate = pickRandom(
          ownUnits.filter((unit) => unit.id !== caster.id && Boolean(unit.qiCard)),
          rng,
        );
        return candidate ? [candidate] : [];
      }
      return ownUnits.filter((unit) => unit.id !== caster.id);
    case "ally_wounded": {
      if (firstTargetId) {
        const selected = ownUnits.find(
          (unit) => unit.id !== caster.id && unit.id === firstTargetId && unit.state === "wounded",
        );
        return selected ? [selected] : [];
      }
      return ownUnits.filter((unit) => unit.id !== caster.id && unit.state === "wounded");
    }
    case "ally_different_zone": {
      if (firstTargetId) {
        const selected = ownUnits.find(
          (unit) =>
            unit.id !== caster.id &&
            unit.id === firstTargetId &&
            normalizeLocation(unit.location) !== normalizeLocation(caster.location),
        );
        return selected ? [selected] : [];
      }
      return ownUnits.filter(
        (unit) => unit.id !== caster.id && normalizeLocation(unit.location) !== normalizeLocation(caster.location),
      );
    }
    case "enemy_location":
      return enemyUnits.filter((unit) => normalizeLocation(unit.location) === normalizeLocation(targetLocation));
    case "enemy":
    case "enemy_single": {
      if (firstTargetId) {
        const selected = enemyUnits.find((unit) => unit.id === firstTargetId);
        return selected ? [selected] : [];
      }
      return enemyUnits.slice(0, 1);
    }
    case "all_enemies":
      return enemyUnits;
    default: {
      if (targetScope === "target_zone_enemies" && targetLocation) {
        return enemyUnits.filter((unit) => normalizeLocation(unit.location) === normalizeLocation(targetLocation));
      }
      if (firstTargetId) {
        const expectedSide = resolveTargetSide(targetType, casterSide);
        const expectedPool = expectedSide === casterSide ? ownUnits : enemyUnits;
        const fallbackPool = expectedSide === casterSide ? enemyUnits : ownUnits;
        const selected =
          expectedPool.find((unit) => unit.id === firstTargetId) ||
          fallbackPool.find((unit) => unit.id === firstTargetId);
        return selected ? [selected] : [];
      }
      return [];
    }
  }
};
