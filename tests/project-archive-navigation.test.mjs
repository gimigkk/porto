import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const sources = [
  "../components/layout/Navbar.tsx",
  "../components/layout/Footer.tsx",
  "../app/(home)/_components/projects/ProjectsSection.tsx",
  "../app/(home)/_components/projects/ProjectCards.tsx",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

test("TestV26_ProjectArchiveControlsAreDisabledWithoutDeadNavigation", () => {
  const source = sources.join("\n");

  assert.doesNotMatch(source, /["'`]\/projects["'`]/);
  assert.match(source, /Project Archive/);
  assert.match(source, /disabled/);
  assert.match(source, /aria-disabled/);
});
