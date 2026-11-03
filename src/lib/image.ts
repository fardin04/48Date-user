/**
 * Member photos from the API are signed storage URLs: they are shown as they are rather than
 * through the image optimizer, so the server never fetches or caches a member's photos. Local
 * SVGs (the placeholder) are served as they are too.
 */
export const isRawImage = (src: string) => !src.startsWith("/") || src.endsWith(".svg");
