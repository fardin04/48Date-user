import { useSyncExternalStore } from "react";

export type DraftPhoto = { id: string; url: string };

let photos: DraftPhoto[] = [];
const listeners = new Set<() => void>();
const NONE: DraftPhoto[] = [];

function emit(next: DraftPhoto[]) {
  photos = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Uploaded profile photos, kept in memory as object URLs for this tab only (the mock
 * service stores nothing). Every URL is revoked when its photo leaves the store.
 */
export const photoStore = {
  add(file: File) {
    emit([...photos, { id: crypto.randomUUID(), url: URL.createObjectURL(file) }]);
  },
  clear() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    emit([]);
  },
};

export function usePhotos(): DraftPhoto[] {
  return useSyncExternalStore(subscribe, () => photos, () => NONE);
}
