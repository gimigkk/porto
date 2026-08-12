export const TOOLTIP_MAX_ROTATION_DEGREES = 25;
export const TOOLTIP_ROTATION_SENSITIVITY = 0.015;

/**
 * Convert vertical pointer velocity (pixels/second) into tooltip rotation.
 * Positive rotation is clockwise in CSS, so upward movement rotates positive.
 */
export function tooltipRotationForVelocity(verticalVelocity: number): number {
  if (!Number.isFinite(verticalVelocity)) return 0;

  const rotation = -verticalVelocity * TOOLTIP_ROTATION_SENSITIVITY;
  if (rotation === 0) return 0;

  return Math.max(
    -TOOLTIP_MAX_ROTATION_DEGREES,
    Math.min(TOOLTIP_MAX_ROTATION_DEGREES, rotation),
  );
}
