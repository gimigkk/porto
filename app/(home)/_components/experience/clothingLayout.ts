const CLEARANCE = 190; // Powerful repulsion gap around selected garment (front half-width 120-138px + 30-40px air buffer)
const PIN_MARGIN = 48; // Edge pin margin within solid rail segment

/**
 * Computes balanced target coordinates across the rail:
 * - Leftmost & rightmost hangers stay pinned to rail ends.
 * - Spacing between all unselected hangers is strictly uniform on both sides.
 * - Prevents garments from squishing when near either end of the rack.
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
    targets[0] = xLeft + 60;
    const startX = targets[0] + CLEARANCE;
    const step = n > 2 ? (xRight - startX) / (n - 2) : 0;
    for (let i = 1; i < n; i++) {
      targets[i] = startX + (i - 1) * step;
    }
    return targets;
  }

  // Selected item is at right end
  if (s === n - 1) {
    targets[n - 1] = xRight - 60;
    const endX = targets[n - 1] - CLEARANCE;
    const step = n > 2 ? (endX - xLeft) / (n - 2) : 0;
    for (let i = 0; i < n - 1; i++) {
      targets[i] = xLeft + i * step;
    }
    return targets;
  }

  // Middle selected item:
  // Distribute remaining space evenly across all unselected hanger gaps (both left and right)
  const leftGaps = Math.max(s - 1, 0);
  const rightGaps = Math.max(n - 1 - s - 1, 0);
  const totalGaps = leftGaps + rightGaps;

  const availSpace = xRight - xLeft - 2 * CLEARANCE;
  const step = totalGaps > 0 ? availSpace / totalGaps : 0;

  // Unselected items to the left
  for (let i = 0; i < s; i++) {
    targets[i] = xLeft + i * step;
  }

  // Selected item placed clearance away from left neighbor
  targets[s] = targets[s - 1] + CLEARANCE;

  // First unselected item to the right placed clearance away
  targets[s + 1] = targets[s] + CLEARANCE;

  // Remaining unselected items to the right spaced with uniform step
  for (let i = s + 2; i < n; i++) {
    targets[i] = targets[i - 1] + step;
  }

  return targets;
}
