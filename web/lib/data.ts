import fs from "node:fs/promises";
import path from "node:path";
import type { Release } from "./types";

const DATA_PATH = path.join(process.cwd(), "..", "data", "releases.json");

export async function getReleases(): Promise<Release[]> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Release[];
  return parsed.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getLatestUpdatedAt(): Promise<string | null> {
  const releases = await getReleases();
  if (releases.length === 0) return null;
  const latest = releases.reduce((acc, r) =>
    new Date(r.summarizedAt).getTime() > new Date(acc.summarizedAt).getTime()
      ? r
      : acc,
  );
  return latest.summarizedAt;
}
