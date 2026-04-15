export function debuglog(message: unknown): void {
  const debug: boolean = false; // set to true to enable debug logging
  
  if (debug) {
    console.log(message);
  }
}

export function minutesToTime(minutes: number): string {
  const normalizedMinutes = Math.min(23 * 60 + 59, Math.max(0, Math.round(minutes)));
  const hours: string = Math.floor(normalizedMinutes / 60)
    .toString()
    .padStart(2, "0");
  const mins: string = (normalizedMinutes % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${mins}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes]: number [] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function assertOptionalString(value: unknown, fieldName: string): asserts value is string | undefined | null {
  if (value != undefined && typeof value !== "string") {
    throw new Error(`Invalid "${fieldName}": expected string, got ${String(value)}`);
  }
}

export function assertOptionalNumber(value: unknown, fieldName: string): asserts value is number | undefined | null {
  if (value != undefined && typeof value !== "number") {
    throw new Error(`Invalid "${fieldName}": expected number, got ${String(value)}`);
  }
}

export function assertOptionalBoolean(value: unknown, fieldName: string): asserts value is boolean | undefined | null {
  if (value != undefined && typeof value !== "boolean") {
    throw new Error(`Invalid "${fieldName}": expected boolean, got ${String(value)}`);
  }
}
