const dayKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMPTY = "—";

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("ar-EG", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ar-EG", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(toDate(value));
}

export function formatShortDate(value: string | Date): string {
  return shortDateFormatter.format(toDate(value));
}

export function formatTime(value: number | Date): string {
  const date = typeof value === "number" ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? EMPTY : timeFormatter.format(date);
}

/** Turns a local `YYYY-MM-DD` day key into local midnight, without UTC shifting it. */
export function parseDayKey(dayKey: string): Date {
  const match = dayKeyPattern.exec(dayKey);
  if (match === null) {
    return new Date(`${dayKey}T00:00:00`);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Short label for a chart axis tick, e.g. `2026-10-04` -> `٤ أكتوبر`. */
export function formatDayKey(dayKey: string): string {
  return shortDateFormatter.format(parseDayKey(dayKey));
}

function toDate(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  // Intl throws on an invalid date, so callers always get a printable value.
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}