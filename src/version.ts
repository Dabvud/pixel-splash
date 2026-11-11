export function formatVersion(version: string, hash: string | undefined, date: Date): string {
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  return `v${version} · ${hash?.trim() || "dev"} · ${part("day")}.${part("month")}. ${part("hour")}:${part("minute")}`;
}
