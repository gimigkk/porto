const CLEARANCE = 195; // Strong repulsion gap around enlarged garment (front half-width 120px + 75px buffer)
const PIN_MARGIN = 48; // Edge pin margin within solid rail segment
const MIN_UNSELECTED_STEP = 28; // Minimum spacing between side hangers

/**
 * Computes strictly equal-gapped target coordinates across the rail:
 * - Leftmost & rightmost hangers stay pinned to rail ends.
 * - Selected garment opens wide in its natural rail slot with strong repulsion.
 * - Garments to the left are pushed away and spaced strictly equally.
 * - Garments to the right are pushed away and spaced strictly equally.
 */
export function getEqualGappedTargets(
  n: number,
  s: number,
  railWidth: number
): number[] {
  const xLeft = PIN_MARGIN;
  const xRight = railWidth - PIN_MARGIN;
  const targets = new Array<number>(n);

  if (n <= 1) {
    return [(xLeft + xRight) / 2];
  }

  // Selected item is at left end
  if (s === 0) {
    targets[0] = xLeft + 100;
    const rightCount = n - 1;
    const startX = targets[0] + CLEARANCE;
    const step = (xRight - startX) / (rightCount - 1);
    for (let i = 1; i < n; i++) {
      targets[i] = startX + (i - 1) * step;
    }
    return targets;
  }

  // Selected item is at right end
  if (s === n - 1) {
    targets[n - 1] = xRight - 100;
    const leftCount = n - 1;
    const endX = targets[n - 1] - CLEARANCE;
    const step = (endX - xLeft) / (leftCount - 1);
    for (let i = 0; i < leftCount; i++) {
      targets[i] = xLeft + i * step;
    }
    return targets;
  }

  // Middle selected item: sits at natural slot ratio, guarded so it never pinches either end
  const minSelX = xLeft + s * MIN_UNSELECTED_STEP + CLEARANCE;
  const maxSelX = xRight - (n - 1 - s) * MIN_UNSELECTED_STEP - CLEARANCE;
  const idealSelX = xLeft + (xRight - xLeft) * (s / (n - 1));
  const selX = Math.max(minSelX, Math.min(idealSelX, maxSelX));
  targets[s] = selX;

  // Evenly distribute and push all items to the left
  if (s === 1) {
    targets[0] = xLeft;
  } else {
    const endX = selX - CLEARANCE;
    const step = (endX - xLeft) / (s - 1);
    for (let i = 0; i < s; i++) {
      targets[i] = xLeft + i * step;
    }
  }

  // Evenly distribute and push all items to the right
  const rightCount = n - 1 - s;
  if (rightCount === 1) {
    targets[n - 1] = xRight;
  } else {
    const startX = selX + CLEARANCE;
    const step = (xRight - startX) / (rightCount - 1);
    for (let i = s + 1; i < n; i++) {
      targets[i] = startX + (i - (s + 1)) * step;
    }
  }

  return targets;
}
