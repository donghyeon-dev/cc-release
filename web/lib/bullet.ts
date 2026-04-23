import type { BulletWithRefs } from "@/lib/types";
import { isBulletWithRefs } from "@/lib/types";

export function getBulletText(item: string | BulletWithRefs): string {
  return isBulletWithRefs(item) ? item.text : item;
}

export function getBulletOriginalRefs(
  item: string | BulletWithRefs,
): number[] {
  return isBulletWithRefs(item) ? item.originalRefs : [];
}

export function hasOriginalRef(
  item: string | BulletWithRefs,
): boolean {
  return getBulletOriginalRefs(item).length > 0;
}
