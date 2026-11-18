import { describe, expect, it } from "vitest";
import { getStoriesPage } from "@/stores/portal-store";
import type { InboxNotification } from "@/lib/api/types/notifications";
import { hrefFor, to, toItem, type Destination } from "@/lib/routes";

function destinationOf(item: InboxNotification): Destination {
  const screen = (item.target?.screen ?? item.type ?? "").toUpperCase();
  const member = item.actor?.nickname;
  const story = item.target?.params?.storyId;
  if (screen.includes("STORY")) return story ? toItem("STORY-DETAIL", story) : to("STORIES");
  if (screen.includes("TRUST") || screen.includes("WARNING") || screen.includes("VERIFICATION")) return to("TRUST");
  if (screen.includes("SUBSCRIPTION") || screen.includes("MEMBERSHIP") || screen.includes("PAYMENT")) return to("MEMBERSHIP");
  if (!member) return to("MATCHES");
  if (screen.includes("DATE")) return toItem("DATE-PENDING", member);
  if (screen.includes("GAME")) return toItem("GAMES", member);
  if (screen.includes("CHAT") || screen.includes("MESSAGE")) return toItem("CHAT-01", member);
  return toItem("MATCH-EXPIRING", member);
}

describe("Story Partner Consent and Author Status Mapping (Phase 23)", () => {
  it("provides copy for partner consent approve, decline, and decline confirmation dialog", () => {
    const copy = getStoriesPage().detail;
    expect(copy.consent.approve).toBe("Approve story");
    expect(copy.consent.decline).toBe("Don’t share");
    expect(copy.consent.approved).toContain("review");
    expect(copy.consent.declined).toContain("won’t be shared");

    expect(copy.declineDialog).toBeDefined();
    expect(copy.declineDialog.title).toBe("Decline this story?");
    expect(copy.declineDialog.confirm).toBe("Decline story");
    expect(copy.declineDialog.keep).toBe("Keep reviewing");
  });

  it("provides distinct status badges and explanatory notes for each author submission stage", () => {
    const copy = getStoriesPage().mine;
    expect(copy.waitingPartnerBadge).toBe("Waiting for partner");
    expect(copy.waitingAdminBadge).toBe("Pending review");
    expect(copy.declinedBadge).toBe("Declined by partner");
    expect(copy.rejectedBadge).toBe("Changes requested");

    expect(copy.waitingPartnerNote).toContain("partner needs to approve");
    expect(copy.waitingAdminNote).toContain("partner approved");
    expect(copy.declinedNote).toContain("partner chose not to share");
  });

  it("provides honest fallback routing for notifications when params.storyId is missing vs present", () => {
    const notificationWithoutStoryId: InboxNotification = {
      id: "notif-1",
      type: "STORY_CONSENT_REQUEST",
      category: "STORIES",
      title: "Story Consent Request",
      body: "Your date partner shared a story.",
      imageUrl: null,
      actor: { nickname: "alice_w", age: 26, mainPhotoUrl: null, isVerified: true, availability: "ACTIVE" },
      target: { screen: "STORY_DETAIL", params: null },
      createdAt: "2026-10-22T10:00:00.000Z",
      readAt: null,
    };

    const destFallback = destinationOf(notificationWithoutStoryId);
    expect(destFallback).toEqual(to("STORIES"));
    if ("screen" in destFallback) {
      expect(hrefFor(destFallback.screen)).toBe("/stories");
    }

    const notificationWithStoryId: InboxNotification = {
      ...notificationWithoutStoryId,
      target: { screen: "STORY_DETAIL", params: { storyId: "story-uuid-123" } },
    };

    const destDirect = destinationOf(notificationWithStoryId);
    expect(destDirect).toEqual(toItem("STORY-DETAIL", "story-uuid-123"));
    if ("screen" in destDirect && "param" in destDirect) {
      expect(hrefFor(destDirect.screen, destDirect.param)).toBe("/stories/story/story-uuid-123");
    }
  });

  it("surfaces waiting consent copy for feed banner when partner arrives at /stories", () => {
    const copy = getStoriesPage().feed;
    expect(copy.waitingConsentTitle).toBe("Stories waiting for your approval");
    expect(copy.waitingConsentAction).toBe("Review story");
  });

  it("handles partner declined status screen copy for author", () => {
    const copy = getStoriesPage().declined;
    expect(copy.title).toContain("chose not to share");
    expect(copy.primary.to).toEqual(to("STORIES"));
  });
});
