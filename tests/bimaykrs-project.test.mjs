import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const source = readFileSync(new URL("../content/projects/bimaykrs.mdx", import.meta.url), "utf8");

test("BIMAyKRS project metadata points to real project and video", () => {
  assert.match(source, /title: "BIMAyKRS"/);
  assert.match(source, /slug: "bimaykrs"/);
  assert.match(source, /thumbnail: "\/projects\/bimaykrs\/BIMAyKRS\.mp4"/);
  assert.match(source, /github: "https:\/\/github\.com\/gimigkk\/BIMAyKRS-upnvyk"/);
  assert.match(source, /Allegedly, automating course enrollment is a little shady/);
  assert.doesNotMatch(source, /Rupiyeah|rupiyeah/);
  assert.equal(existsSync(new URL("../public/projects/bimaykrs/BIMAyKRS.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/projects/bimaykrs/BIMAyKRS-sm.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/projects/bimaykrs/BIMAyKRS-poster.jpg", import.meta.url)), true);
});
