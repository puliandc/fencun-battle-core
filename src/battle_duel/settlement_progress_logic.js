export const stepSettlementProgress = ({ status, now, startedAt, phase }) => {
  if (status !== "ROUND_END") {
    return {
      startedAt,
      phase,
      shouldStartNextRound: false,
      changed: false,
    };
  }

  if (!startedAt) {
    return {
      startedAt: now,
      phase: "from",
      shouldStartNextRound: false,
      changed: true,
    };
  }

  const elapsed = now - startedAt;
  if (elapsed >= 2000) {
    return {
      startedAt: null,
      phase: "to",
      shouldStartNextRound: true,
      changed: true,
    };
  }

  if (elapsed >= 1000 && phase !== "to") {
    return {
      startedAt,
      phase: "to",
      shouldStartNextRound: false,
      changed: true,
    };
  }

  return {
    startedAt,
    phase,
    shouldStartNextRound: false,
    changed: false,
  };
};
