export const MOBILE_MEDIA_QUERY = "(width < 48rem)";
export const STACK_TOP_PROPERTY = "--folder-stack-top";
export const FOLDER_FIT_SAFETY_PX = 8;

export type StackSectionKey = "about" | "experience" | "projects";
export type FolderDockMode = "folder" | "crop" | "flow";
export type FolderOverflowMode = Exclude<FolderDockMode, "folder">;

export type StackSectionValues = Record<StackSectionKey, number>;

export interface StackRanges {
  aboutDock: number;
  experienceDock: number;
  projectsArrival: number;
}

function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function progressBetween(scroll: number, start: number, end: number): number {
  const safeScroll = finiteOrZero(scroll);
  const safeStart = finiteOrZero(start);
  const safeEnd = finiteOrZero(end);

  if (safeEnd <= safeStart) return safeScroll >= safeEnd ? 1 : 0;
  return clampProgress((safeScroll - safeStart) / (safeEnd - safeStart));
}

export function createStackRanges(
  anchors: StackSectionValues,
  stackTops: StackSectionValues,
): StackRanges {
  return {
    aboutDock: finiteOrZero(anchors.about) - Math.max(0, finiteOrZero(stackTops.about)),
    experienceDock:
      finiteOrZero(anchors.experience) - Math.max(0, finiteOrZero(stackTops.experience)),
    projectsArrival:
      finiteOrZero(anchors.projects) - Math.max(0, finiteOrZero(stackTops.projects)),
  };
}

export function getFolderDockMode(
  folderHeight: number,
  smallViewportHeight: number,
  stackTop: number,
  overflowMode: FolderOverflowMode = "crop",
  safetyPx = FOLDER_FIT_SAFETY_PX,
): FolderDockMode {
  const safeFolderHeight = Math.max(0, finiteOrZero(folderHeight));
  const availableHeight = Math.max(
    0,
    finiteOrZero(smallViewportHeight) -
      Math.max(0, finiteOrZero(stackTop)) -
      Math.max(0, finiteOrZero(safetyPx)),
  );

  return safeFolderHeight <= availableHeight ? "folder" : overflowMode;
}

export function getParallaxSeamExtension(
  currentOffset: number,
  nextOffset: number,
): number {
  return Math.max(0, finiteOrZero(nextOffset) - finiteOrZero(currentOffset));
}

export function navigationOffsetForStackTop(stackTop: number): number {
  const safeStackTop = Math.max(0, finiteOrZero(stackTop));
  return safeStackTop === 0 ? 0 : -safeStackTop;
}

export function readStackTop(element: Element | null): number {
  if (!element || typeof getComputedStyle === "undefined") return 0;
  const parsed = Number.parseFloat(getComputedStyle(element).getPropertyValue(STACK_TOP_PROPERTY));
  return Math.max(0, finiteOrZero(parsed));
}

export function getDocumentTop(element: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top;
}

export function resolveSectionNavigationOffset(anchor: Element | null): number {
  return navigationOffsetForStackTop(readStackTop(resolveSectionNavigationTarget(anchor)));
}

export function resolveSectionNavigationTarget(anchor: Element | null): HTMLElement | null {
  const folderRoot = anchor?.nextElementSibling;
  return folderRoot instanceof HTMLElement ? folderRoot : null;
}
