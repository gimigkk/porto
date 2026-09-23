import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const source = readFileSync(new URL("../content/projects/insectropy.mdx", import.meta.url), "utf8");

test("Insectropy project metadata points to real trailer, Top 20 nationals, and assets", () => {
  assert.match(source, /title: "Insectropy"/);
  assert.match(source, /slug: "insectropy"/);
  assert.match(source, /thumbnail: "\/projects\/insectropy\/trailer\.mp4"/);
  assert.match(source, /https:\/\/youtu\.be\/CAam4aXN3Jg/);
  assert.match(source, /Top 20 Nationals|Top 20 Finalis Nasional/);
  assert.match(source, /Top 3/);
  assert.match(source, /2,377|2,300\+/);
  assert.equal(existsSync(new URL("../public/projects/insectropy/trailer.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/projects/insectropy/trailer-sm.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/projects/insectropy/trailer-poster.jpg", import.meta.url)), true);
});
