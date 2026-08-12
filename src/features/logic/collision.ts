export interface OverlapResult {
  overlap: number;
  overlapLeft: number;
  overlapRight: number;
  totalCut: number;
}

export function calculateOverlap(aLeft: number, aRight: number, bLeft: number, bRight: number): OverlapResult {
  const overlapLeft = Math.max(aLeft, bLeft);
  const overlapRight = Math.min(aRight, bRight);
  const overlap = overlapRight - overlapLeft;
  const totalCut = Math.max(0, overlapLeft - aLeft) + Math.max(0, aRight - overlapRight);
  return { overlap, overlapLeft, overlapRight, totalCut };
}
