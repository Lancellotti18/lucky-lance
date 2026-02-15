export function calculatePotOdds(
  potSize: number,
  amountToCall: number
): number {
  if (amountToCall <= 0) return 0;
  return amountToCall / (potSize + amountToCall);
}

export function formatPotOddsRatio(
  potSize: number,
  amountToCall: number
): string {
  if (amountToCall <= 0) return "N/A";
  const ratio = potSize / amountToCall;
  return `${ratio.toFixed(1)}:1`;
}

export function calculateImpliedOdds(
  potSize: number,
  amountToCall: number,
  expectedFutureWinnings: number
): number {
  if (amountToCall <= 0) return 0;
  return amountToCall / (potSize + amountToCall + expectedFutureWinnings);
}
