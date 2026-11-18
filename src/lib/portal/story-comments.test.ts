import { describe, expect, it } from "vitest";
import { mergeComments, withoutComment, type CommentItem } from "./story-comments";

/** Phase 21: comment pages append without duplicates; a deleted comment leaves every page. */
const c = (id: string, mine = false): CommentItem => ({ id, author: mine ? "me" : "clara_d", text: `text ${id}`, mine });

describe("story comments", () => {
  it("appends pages in order, keeping each comment once", () => {
    expect(mergeComments([[c("1"), c("2")], [c("2"), c("3")]]).map((comment) => comment.id)).toEqual(["1", "2", "3"]);
    expect(mergeComments([])).toEqual([]);
  });

  it("removes a deleted comment from whichever page holds it", () => {
    const pages = withoutComment([[c("1"), c("2", true)], [c("3")]], "2");
    expect(pages.map((page) => page.map((comment) => comment.id))).toEqual([["1"], ["3"]]);
  });
});
