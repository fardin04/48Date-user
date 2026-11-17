/** A chosen photo before upload: one of the accepted types (JPG / PNG / WebP) and no larger than `maxBytes`. */
export const isAcceptedPhoto = (file: Pick<File, "type" | "size">, accept: readonly string[], maxBytes: number) =>
  accept.includes(file.type) && file.size > 0 && file.size <= maxBytes;
