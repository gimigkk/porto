import assert from "node:assert/strict";
import test from "node:test";

import {
  TOOLTIP_MAX_ROTATION_DEGREES,
  tooltipRotationForVelocity,
} from "../components/ui/tooltip/tooltipMotion.ts";

test("Tooltip rotation follows vertical movement direction", () => {
  assert.equal(tooltipRotationForVelocity(-200), 3);
  assert.equal(tooltipRotationForVelocity(200), -3);
  assert.equal(tooltipRotationForVelocity(0), 0);
});

test("Tooltip rotation is capped", () => {
  assert.equal(
    tooltipRotationForVelocity(-10_000),
    TOOLTIP_MAX_ROTATION_DEGREES,
  );
  assert.equal(
    tooltipRotationForVelocity(10_000),
    -TOOLTIP_MAX_ROTATION_DEGREES,
  );
});

test("Invalid pointer velocity produces neutral rotation", () => {
  assert.equal(tooltipRotationForVelocity(Number.NaN), 0);
  assert.equal(tooltipRotationForVelocity(Number.POSITIVE_INFINITY), 0);
});
