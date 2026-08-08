import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const experienceSource = readFileSync(
  new URL("../app/(home)/_components/experience/ExperienceSection.tsx", import.meta.url),
  "utf8",
);
const folderSectionSource = readFileSync(
  new URL("../components/layout/FolderSection.tsx", import.meta.url),
  "utf8",
);
const stackedSectionsSource = readFileSync(
  new URL("../components/layout/StackedSections.tsx", import.meta.url),
  "utf8",
);
const geometryHookSource = readFileSync(
  new URL("../hooks/useStackedSectionGeometry.ts", import.meta.url),
  "utf8",
);
const lenisProviderSource = readFileSync(
  new URL("../components/providers/LenisProvider.tsx", import.meta.url),
  "utf8",
);

test("TestV15_ExperienceIntrinsicHeightHasNoNegativeOuterCompensation", () => {
  assert.doesNotMatch(experienceSource, /min-height:900px[^"\n]*-mt-/);
});

test("TestV16_FollowingFoldersOverlapTheirTabRows", () => {
  assert.match(folderSectionSource, /-mt-5 sm:-mt-7 md:-mt-10/);
  assert.equal((stackedSectionsSource.match(/overlapPrevious/g) ?? []).length, 2);
  assert.doesNotMatch(folderSectionSource, /data-folder-bleed/);
});

test("TestV18_GeometryUsesFolderRootPositions", () => {
  assert.match(geometryHookSource, /about: getDocumentTop\(aboutRoot\)/);
  assert.match(geometryHookSource, /experience: getDocumentTop\(experienceRoot\)/);
  assert.match(geometryHookSource, /projects: getDocumentTop\(projectsRoot\)/);
});

test("TestV17_ExperienceDesktopContentUsesLayoutInset", () => {
  assert.match(experienceSource, /md:mt-6/);
  assert.doesNotMatch(experienceSource, /md:translate-y-6/);
});

test("TestV19_SeamExtensionMatchesFolderAnimatedSurface", () => {
  assert.match(stackedSectionsSource, /seamExtension=\{getParallaxSeamExtension\(-60, 0\)\}/);
  assert.match(folderSectionSource, /data-folder-seam-extension/);
  assert.match(folderSectionSource, /style=\{\{ background: bgFaded, opacity: overlayOpacity/);
});

test("TestV13_CropModeKeepsWholeFolderDockedWithoutNestedScroll", () => {
  assert.match(folderSectionSource, /dockMode !== "flow"/);
  assert.match(folderSectionSource, /data-folder-body/);
  assert.match(folderSectionSource, /max-h-\[calc\(100svh-var\(--folder-stack-top\)-8px\)\]/);
  assert.doesNotMatch(folderSectionSource, /dockMode === "tab"/);
  assert.doesNotMatch(folderSectionSource, /overflow-y-(?:auto|scroll)/);
});

test("TestV20_CropMeasurementUsesIntrinsicBodyScrollHeight", () => {
  assert.match(geometryHookSource, /clip\.scrollHeight/);
  assert.match(geometryHookSource, /content\.offsetHeight - clip\.clientHeight/);
  assert.match(geometryHookSource, /tabRow\.offsetHeight/);
});

test("TestV21_AllSectionContentsShareVerticalPadding", () => {
  assert.match(stackedSectionsSource, /const SECTION_CONTENT_PADDING = "py-16 md:py-24"/);
  assert.equal((stackedSectionsSource.match(/data-folder-content className/g) ?? []).length, 3);
  assert.equal((stackedSectionsSource.match(/SECTION_CONTENT_PADDING/g) ?? []).length, 4);

  const projectsContent = stackedSectionsSource.lastIndexOf("data-folder-content");
  const footer = stackedSectionsSource.lastIndexOf("<Footer />");
  assert.ok(projectsContent >= 0 && footer > projectsContent);
});

test("TestV23_CroppedFoldersReservePaddingOutsideInnerClip", () => {
  assert.equal((stackedSectionsSource.match(/data-folder-content-clip/g) ?? []).length, 1);
  assert.equal(
    (stackedSectionsSource.match(/className="min-h-0 flex-1 overflow-hidden"/g) ?? []).length,
    1,
  );
  assert.match(folderSectionSource, /relative z-10 w-full min-h-0 flex flex-col/);
});

test("TestV24_AboutUsesFlowFallbackWithoutInnerClip", () => {
  assert.match(geometryHookSource, /getFolderDockMode\([\s\S]*?stackTops\.about,[\s\S]*?"flow"/);
  assert.match(folderSectionSource, /dockMode === "flow" \? 0 : y/);
});

test("TestV25_WheelInputReversesWithoutLenisMomentumBacklog", () => {
  assert.match(lenisProviderSource, /smoothWheel:\s*true/);
  assert.match(lenisProviderSource, /virtualScroll:\s*handleVirtualScroll/);
  assert.match(lenisProviderSource, /Math\.sign\(deltaY\) !== Math\.sign\(pendingDelta\)/);
  assert.match(lenisProviderSource, /lenis\.scrollTo\(lenis\.actualScroll, \{ immediate: true \}\)/);
  assert.match(lenisProviderSource, /return true/);
});
