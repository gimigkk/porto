import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

const source = readFileSync(new URL("../content/projects/imah-keramik-bogor.mdx", import.meta.url), "utf8");

test("Imah Keramik Bogor project metadata points to real project and video", () => {
  assert.match(source, /title: "Imah Keramik Bogor"/);
  assert.match(source, /slug: "imah-keramik-bogor"/);
  assert.match(source, /thumbnail: "\/projects\/imah-keramik-bogor\/imah-keramik\.mp4"/);
  assert.match(source, /github: "https:\/\/github\.com\/gimigkk\/Imah-Keramik-Bogor"/);
  assert.match(source, /https:\/\/imah-keramik-bogor\.vercel\.app/);
  assert.equal(existsSync(new URL("../public/projects/imah-keramik-bogor/imah-keramik.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/projects/imah-keramik-bogor/imah-keramik-sm.mp4", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public/projects/imah-keramik-bogor/imah-keramik-poster.jpg", import.meta.url)), true);
});

