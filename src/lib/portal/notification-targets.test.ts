import { describe, expect, it } from "vitest";
import { destinationOf } from "@/lib/portal/api-account-service";
import type { InboxNotification } from "@/lib/api/types/notifications";
import type { OtherUser } from "@/lib/api/types/matches";

const testActor: OtherUser = {
  nickname: "sara",
  mainPhotoUrl: null,
  availability: "ACTIVE",
  age: 26,
  isVerified: true,
};

function makeNotification(partial: Partial<InboxNotification>): InboxNotification {
  return {
    id: "notif_1",
    type: "MATCH_NEW",
    category: "MATCHES",
    title: "Test",
    body: "Test body",
    imageUrl: null,
    actor: null,
    target: null,
    readAt: null,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

describe("destinationOf", () => {
  it("maps story notifications with storyId to STORY-DETAIL and without storyId to STORIES", () => {
    const withStory = makeNotification({
      type: "STORY_APPROVED",
      category: "STORIES",
      target: { screen: "STORY_DETAIL", params: { storyId: "story_123" } },
    });
    expect(destinationOf(withStory)).toEqual({ screen: "STORY-DETAIL", param: "story_123" });

    const withoutStory = makeNotification({
      type: "STORY_PARTNER_REQUESTED",
      category: "STORIES",
      target: { screen: "STORY_DETAIL" },
    });
    expect(destinationOf(withoutStory)).toEqual({ screen: "STORIES" });
  });

  it("maps trust, warning, and verification notifications to TRUST", () => {
    expect(destinationOf(makeNotification({ type: "VERIFICATION_PASSED", category: "TRUST" }))).toEqual({ screen: "TRUST" });
    expect(destinationOf(makeNotification({ type: "VERIFICATION_REJECTED", category: "TRUST" }))).toEqual({ screen: "TRUST" });
    expect(destinationOf(makeNotification({ type: "ACCOUNT_WARNING", category: "TRUST" }))).toEqual({ screen: "TRUST" });
    expect(destinationOf(makeNotification({ target: { screen: "TRUST" } }))).toEqual({ screen: "TRUST" });
  });

  it("maps subscription, membership, and payment notifications to MEMBERSHIP", () => {
    expect(destinationOf(makeNotification({ target: { screen: "MEMBERSHIP" } }))).toEqual({ screen: "MEMBERSHIP" });
    expect(destinationOf(makeNotification({ target: { screen: "SUBSCRIPTION" } }))).toEqual({ screen: "MEMBERSHIP" });
  });

  it("maps date rating request to FEEDBACK for actor, or MATCHES when actor is missing", () => {
    const withActor = makeNotification({
      type: "DATE_RATE_REQUEST",
      category: "DATES",
      actor: testActor,
    });
    expect(destinationOf(withActor)).toEqual({ screen: "FEEDBACK", param: "sara" });

    const noActor = makeNotification({
      type: "DATE_RATE_REQUEST",
      category: "DATES",
    });
    expect(destinationOf(noActor)).toEqual({ screen: "MATCHES" });
  });

  it("maps date events with actor to DATE-PENDING", () => {
    const notif = makeNotification({
      type: "DATE_INVITE_RECEIVED",
      category: "DATES",
      target: { screen: "DATE_DETAIL", params: { dateId: "d1" } },
      actor: testActor,
    });
    expect(destinationOf(notif)).toEqual({ screen: "DATE-PENDING", param: "sara" });
  });

  it("maps game events with actor to GAMES", () => {
    const notif = makeNotification({
      type: "GAME_INVITE",
      category: "GAMES",
      target: { screen: "GAME" },
      actor: testActor,
    });
    expect(destinationOf(notif)).toEqual({ screen: "GAMES", param: "sara" });
  });

  it("maps chat and message events with actor to CHAT-01", () => {
    const notif = makeNotification({
      type: "MESSAGE_NEW",
      category: "CHATS",
      target: { screen: "CHAT" },
      actor: testActor,
    });
    expect(destinationOf(notif)).toEqual({ screen: "CHAT-01", param: "sara" });
  });

  it("maps match events with actor to MATCH-EXPIRING", () => {
    const notif = makeNotification({
      type: "MATCH_EXPIRING_SOON",
      category: "MATCHES",
      target: { screen: "MATCHES" },
      actor: testActor,
    });
    expect(destinationOf(notif)).toEqual({ screen: "MATCH-EXPIRING", param: "sara" });
  });

  it("returns null (plain row) for NONE, REPORT_REVIEWED, ANNOUNCEMENT, or missing actor for member targets", () => {
    expect(destinationOf(makeNotification({ target: { screen: "NONE" } }))).toBeNull();
    expect(destinationOf(makeNotification({ type: "REPORT_REVIEWED", category: "SAFETY" }))).toBeNull();
    expect(destinationOf(makeNotification({ type: "ANNOUNCEMENT", category: "SYSTEM" }))).toBeNull();
    // Missing actor for a date or chat target degrades to null instead of broken route
    expect(destinationOf(makeNotification({ type: "DATE_ACCEPTED", category: "DATES" }))).toBeNull();
    expect(destinationOf(makeNotification({ type: "MESSAGE_NEW", category: "CHATS" }))).toBeNull();
  });
});
