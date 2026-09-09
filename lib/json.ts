// SQLite has no native Json column type, so Json-shaped fields (GameSession.resultDetail,
// GameConfig.value) are stored as serialized text. These helpers keep the
// parse/stringify calls consistent and null-safe at every call site.

export function toJson(value: unknown): string {
  return JSON.stringify(value);
}

export function fromJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
