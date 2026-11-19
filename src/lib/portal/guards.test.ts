import { describe, expect, it } from "vitest";
import { decideSessionGate, decideSetupGate } from "./guards";

describe("SessionGate decision logic", () => {
  it("waits while session is loading (null)", () => {
    const memberGate = decideSessionGate("member", null, "SIGNIN");
    expect(memberGate.allowed).toBeNull();
    expect(memberGate.shouldRedirect).toBe(false);

    const guestGate = decideSessionGate("guest", null, "DISCOVER");
    expect(guestGate.allowed).toBeNull();
    expect(guestGate.shouldRedirect).toBe(false);
  });

  it("permits signed-in members on member routes and redirects signed-out visitors to SIGNIN", () => {
    const memberAllowed = decideSessionGate("member", true, "SIGNIN");
    expect(memberAllowed.allowed).toBe(true);
    expect(memberAllowed.shouldRedirect).toBe(false);
    expect(memberAllowed.target).toBeUndefined();

    const memberDenied = decideSessionGate("member", false, "SIGNIN");
    expect(memberDenied.allowed).toBe(false);
    expect(memberDenied.shouldRedirect).toBe(true);
    expect(memberDenied.target).toBe("SIGNIN");
  });

  it("permits signed-out visitors on guest routes and forwards signed-in members to DISCOVER", () => {
    const guestAllowed = decideSessionGate("guest", false, "DISCOVER");
    expect(guestAllowed.allowed).toBe(true);
    expect(guestAllowed.shouldRedirect).toBe(false);
    expect(guestAllowed.target).toBeUndefined();

    const guestForwarded = decideSessionGate("guest", true, "DISCOVER");
    expect(guestForwarded.allowed).toBe(false);
    expect(guestForwarded.shouldRedirect).toBe(true);
    expect(guestForwarded.target).toBe("DISCOVER");
  });
});

describe("SetupGate decision logic", () => {
  it("immediately lets through members known to have finished setup (known === 'portal')", () => {
    const decision = decideSetupGate("portal", undefined, undefined);
    expect(decision.shouldPass).toBe(true);
    expect(decision.isWaiting).toBe(false);
    expect(decision.shouldRedirect).toBe(false);
  });

  it("waits while onboarding progress is loading", () => {
    const decision = decideSetupGate(null, undefined, undefined);
    expect(decision.shouldPass).toBe(false);
    expect(decision.isWaiting).toBe(true);
    expect(decision.shouldRedirect).toBe(false);
  });

  it("fails open if reading progress fails with an error (never locks out on network error)", () => {
    const decision = decideSetupGate(null, undefined, new Error("Network timeout"));
    expect(decision.shouldPass).toBe(true);
    expect(decision.isWaiting).toBe(false);
    expect(decision.shouldRedirect).toBe(false);
  });

  it("redirects unfinished members (completed === false) to LOCATION", () => {
    const decision = decideSetupGate(null, { completed: false }, undefined);
    expect(decision.shouldPass).toBe(false);
    expect(decision.isWaiting).toBe(false);
    expect(decision.shouldRedirect).toBe(true);
    expect(decision.target).toBe("LOCATION");
  });

  it("passes members who completed setup", () => {
    const decision = decideSetupGate(null, { completed: true }, undefined);
    expect(decision.shouldPass).toBe(true);
    expect(decision.isWaiting).toBe(false);
    expect(decision.shouldRedirect).toBe(false);
  });
});
