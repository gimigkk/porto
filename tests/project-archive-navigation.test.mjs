import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, existsSync } from "node:fs";

const navbarSource = readFileSync(new URL("../components/layout/Navbar.tsx", import.meta.url), "utf8");
const footerSource = readFileSync(new URL("../components/layout/Footer.tsx", import.meta.url), "utf8");
const sectionSource = readFileSync(new URL("../app/(home)/_components/projects/ProjectsSection.tsx", import.meta.url), "utf8");
const cardsSource = readFileSync(new URL("../app/(home)/_components/projects/ProjectCards.tsx", import.meta.url), "utf8");
const archivePageSource = readFileSync(new URL("../app/projects/page.tsx", import.meta.url), "utf8");
const archiveClientSource = readFileSync(new URL("../app/projects/_components/ProjectsArchiveClient.tsx", import.meta.url), "utf8");
const modalSource = readFileSync(new URL("../app/(home)/_components/projects/ClientProjectModal.tsx", import.meta.url), "utf8");

test("TestV26_ProjectArchiveControlsNavigateToProjectsRoute", () => {
  // Archive route page exists
  assert.equal(existsSync(new URL("../app/projects/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/projects/_components/ProjectsArchiveClient.tsx", import.meta.url)), true);

  // Archive page uses getAllProjects and ItemList schema
  assert.match(archivePageSource, /getAllProjects/);
  assert.match(archivePageSource, /ItemList/);

  // Navbar, Footer, ProjectsSection, and ProjectCards link to /projects
  assert.match(navbarSource, /href:\s*["']\/projects["']/);
  assert.match(footerSource, /href=["']\/projects["']/);
  assert.match(sectionSource, /href=["']\/projects["']/);
  assert.match(cardsSource, /href=["']\/projects["']/);

  // Archive client contains Back to Home button linking to /
  assert.match(archiveClientSource, /href=["']\/["']/);
  assert.match(archiveClientSource, /Back to Home/);

  // Archive client uses standard container gutter max-w-350 mx-auto px-4 md:px-12
  assert.match(archiveClientSource, /max-w-350 mx-auto px-4 md:px-12/);

  // Modal has unmount scroll lock cleanup
  assert.match(modalSource, /document\.documentElement\.style\.overflow = ["']/);
});
