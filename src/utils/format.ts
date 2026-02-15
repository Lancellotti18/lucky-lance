export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatOddsRatio(potSize: number, amountToCall: number): string {
  if (amountToCall === 0) return "N/A";
  const ratio = potSize / amountToCall;
  return `${ratio.toFixed(1)}:1`;
}
