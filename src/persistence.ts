/** Versioned, defensive local persistence for demo business data. */
export const STORAGE_KEY = "shopflow-data";
export const DATA_VERSION = 1;
export type LoadResult<T> = { value: T; recovered: boolean; migrated: boolean };
export function loadBusinessData<T extends Record<string, unknown>>(
  seed: T,
  storage: Storage = localStorage,
): LoadResult<T> {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { value: seed, recovered: false, migrated: false };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object")
      throw new Error("Invalid saved data");
    const candidate = parsed as Record<string, unknown>;
    // Migrate the first dashboard prototype, which stored the data object directly.
    const legacy = !("version" in candidate);
    const data = legacy ? candidate : candidate.data;
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("Invalid data payload");
    if (!legacy && candidate.version !== DATA_VERSION)
      throw new Error("Unsupported saved data version");
    const merged = { ...seed, ...(data as Partial<T>) } as T;
    for (const key of Object.keys(seed)) {
      const saved = (data as Record<string, unknown>)[key];
      if (
        saved !== undefined &&
        (!Array.isArray(saved) ||
          saved.some(
            (row) =>
              !row ||
              typeof row !== "object" ||
              typeof (row as Record<string, unknown>).id !== "string",
          ))
      )
        throw new Error(`Invalid ${key} collection`);
      const ids = new Set<string>();
      for (const row of (saved as Array<{ id: string }> | undefined) || []) {
        if (ids.has(row.id)) throw new Error(`Duplicate ${key} identifier`);
        ids.add(row.id);
      }
    }
    return { value: merged, recovered: false, migrated: legacy };
  } catch {
    storage.removeItem(STORAGE_KEY);
    return { value: seed, recovered: true, migrated: false };
  }
}
export function saveBusinessData<T>(
  value: T,
  storage: Storage = localStorage,
): void {
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: DATA_VERSION, data: value }),
  );
}
export function resetBusinessData<T>(
  seed: T,
  storage: Storage = localStorage,
): T {
  saveBusinessData(seed, storage);
  return seed;
}
