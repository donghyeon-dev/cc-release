const TZ = "Asia/Seoul";

function getParts(iso: string) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return parts;
}

export function formatDateKorean(iso: string): string {
  const { year, month, day } = getParts(iso);
  return `${year}-${month}-${day}`;
}

export function formatDateTimeKorean(iso: string): string {
  const { year, month, day, hour, minute } = getParts(iso);
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
