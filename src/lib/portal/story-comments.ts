/** One comment as STORY-DETAIL lists it: the author's nickname, and whether it is the member's own (deletable). */
export type CommentItem = { id: string; author: string; text: string; mine: boolean };

/** Loaded pages in order, each comment once (a comment posted meanwhile can shift into the next page). */
export function mergeComments(pages: CommentItem[][]): CommentItem[] {
  const seen = new Set<string>();
  return pages.flat().filter((comment) => !seen.has(comment.id) && (seen.add(comment.id), true));
}

/** The pages without a deleted comment. */
export const withoutComment = (pages: CommentItem[][], id: string) => pages.map((page) => page.filter((comment) => comment.id !== id));
