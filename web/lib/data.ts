import fs from "node:fs/promises";
import path from "node:path";
import type { Release, SiteMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "..", "data");
const RELEASES_PATH = path.join(DATA_DIR, "releases.json");
const SITE_META_PATH = path.join(DATA_DIR, "site-meta.json");

export async function getReleases(): Promise<Release[]> {
  const raw = await fs.readFile(RELEASES_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Release[];
  return parsed.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getSiteMeta(): Promise<SiteMeta> {
  try {
    const raw = await fs.readFile(SITE_META_PATH, "utf-8");
    return JSON.parse(raw) as SiteMeta;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return {};
    throw error;
  }
}

export async function getLatestUpdatedAt(): Promise<string | null> {
  const meta = await getSiteMeta();
  if (
    typeof meta.lastRoutineRunAt === "string" &&
    !Number.isNaN(new Date(meta.lastRoutineRunAt).getTime())
  ) {
    return meta.lastRoutineRunAt;
  }

  const releases = await getReleases();
  if (releases.length === 0) return null;
  const latest = releases.reduce((acc, r) =>
    new Date(r.summarizedAt).getTime() > new Date(acc.summarizedAt).getTime()
      ? r
      : acc,
  );
  return latest.summarizedAt;
}
