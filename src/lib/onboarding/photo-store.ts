import { useSyncExternalStore } from "react";

/** `fileId` is the API's id for the uploaded file (none with the mock). */
export type DraftPhoto = { id: string; url: string; fileId?: string };

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
  /** Takes ownership of an object URL created for an uploaded file. */
  add(url: string, fileId?: string) {
    emit([...photos, { id: crypto.randomUUID(), url, fileId }]);
  },
  /** The main photo is the first one (sent as `isMain`). */
  makeMain(id: string) {
    const chosen = photos.find((photo) => photo.id === id);
    if (chosen) emit([chosen, ...photos.filter((photo) => photo !== chosen)]);
  },
  remove(id: string) {
    const gone = photos.find((photo) => photo.id === id);
    if (!gone) return;
    URL.revokeObjectURL(gone.url);
    emit(photos.filter((photo) => photo !== gone));
  },
  read: () => photos,
  clear() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    emit([]);
  },
};

export function usePhotos(): DraftPhoto[] {
  return useSyncExternalStore(subscribe, () => photos, () => NONE);
}
