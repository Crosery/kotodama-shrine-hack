const storagePrefix = "kotodama.h5.dialogue";

export function storageKey(key: string) {
  return `${storagePrefix}:${key}`;
}

export function readJson<T>(key: string): T | null {
  const raw = localStorage.getItem(storageKey(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(storageKey(key), JSON.stringify(value));
}

export function removeKey(key: string) {
  localStorage.removeItem(storageKey(key));
}

