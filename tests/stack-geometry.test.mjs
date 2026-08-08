import assert from "node:assert/strict";
import test from "node:test";

import {
  MOBILE_MEDIA_QUERY,
  clampProgress,
  createStackRanges,
  getFolderDockMode,
  getParallaxSeamExtension,
  navigationOffsetForStackTop,
  progressBetween,
} from "../components/layout/stackGeometry.ts";

test("TestV11_DynamicAnchorsProduceSemanticRanges", () => {
  assert.deepEqual(
    createStackRanges(
      { about: 900, experience: 1480, projects: 2100 },
      { about: 80, experience: 120, projects: 160 },
    ),
    { aboutDock: 820, experienceDock: 1360, projectsArrival: 1940 },
  );
});

test("TestV3_ProgressIsMonotonicAndClamped", () => {
  const samples = [-100, 0, 25, 50, 75, 100, 200].map((scroll) =>
    progressBetween(scroll, 0, 100),
  );

  assert.deepEqual(samples, [0, 0, 0.25, 0.5, 0.75, 1, 1]);
  assert.equal(clampProgress(Number.NaN), 0);
  assert.equal(clampProgress(Number.POSITIVE_INFINITY), 0);
});

test("TestV3_ZeroLengthRangeFailsSafely", () => {
  assert.equal(progressBetween(99, 100, 100), 0);
  assert.equal(progressBetween(100, 100, 100), 1);
  assert.equal(progressBetween(101, 100, 100), 1);
});

test("TestV9_FolderDockModeUsesStableViewportBudget", () => {
  assert.equal(getFolderDockMode(612, 800, 80), "folder");
  assert.equal(getFolderDockMode(713, 800, 80), "crop");
  assert.equal(getFolderDockMode(520, 568, 48), "crop");
  assert.equal(getFolderDockMode(520, 568, 48, "flow"), "flow");
});

test("TestV10_NavigationOffsetUsesStackTop", () => {
  assert.equal(navigationOffsetForStackTop(48), -48);
  assert.equal(navigationOffsetForStackTop(120), -120);
  assert.equal(navigationOffsetForStackTop(-20), 0);
});

test("TestV12_MobileQueryExcludesExact768Pixels", () => {
  assert.equal(MOBILE_MEDIA_QUERY, "(width < 48rem)");
});

test("TestV19_ParallaxSeamExtensionOnlyCoversPositiveOffsetDelta", () => {
  assert.equal(getParallaxSeamExtension(-40, -60), 0);
  assert.equal(getParallaxSeamExtension(-60, 0), 60);
  assert.equal(getParallaxSeamExtension(0, 0), 0);
});
