import type { Dataset } from "./types";

const KEY = "gudstat_v2_dataset";

export function loadDataset(): Dataset | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Dataset) : null;
  } catch {
    return null;
  }
}

export function saveDataset(ds: Dataset): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ds));
  } catch {
    /* quota / private mode — abaikan */
  }
}

export function clearDataset(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
