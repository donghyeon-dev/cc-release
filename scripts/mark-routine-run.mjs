#!/usr/bin/env node
// Records the latest successful routine execution time for the website header.

import fs from "node:fs";
import path from "node:path";

const target = path.resolve("data/site-meta.json");
const now = new Date().toISOString();

let previous = {};
if (fs.existsSync(target)) {
  try {
    previous = JSON.parse(fs.readFileSync(target, "utf-8"));
  } catch (error) {
    console.error(`[FATAL] ${target} JSON 파싱 실패: ${error.message}`);
    process.exit(1);
  }
}

const next = {
  ...previous,
  lastRoutineRunAt: now,
};

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`, "utf-8");

console.log(`routine timestamp updated: ${now}`);
