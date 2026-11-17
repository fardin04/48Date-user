import { describe, expect, it } from "vitest";
import { hrefFor, screens } from "@/lib/routes";
import { authFlows } from "./flows";

// Phase 4: every step action of the auth flows opens a real page (no notFunctional dead ends on a sign-in path).
describe("auth flow actions", () => {
  for (const [name, flow] of Object.entries(authFlows)) {
    const actions = [
      flow.entry.switchAction,
      flow.verify.limit.primary,
      flow.verify.limit.secondary,
      flow.verified.cta,
      flow.verified.next.onboarding,
      flow.verified.next.portal,
      flow.google.primary,
      flow.google.secondary,
      flow.googleError.primary,
      flow.googleError.secondary,
      ...(flow.session ? [flow.session.primary, flow.session.secondary] : []),
    ];

    it(`${name}: every action is a link to a known screen`, () => {
      for (const action of actions) {
        expect("screen" in action.to, action.label).toBe(true);
        if ("screen" in action.to) expect(screens[action.to.screen], action.label).toBeTypeOf("string");
      }
    });

    it(`${name}: setup routing sends unfinished members to setup and finished ones to the portal`, () => {
      expect(hrefFor(flow.verified.next.onboarding.to.screen)).toBe("/onboarding/location");
      expect(hrefFor(flow.verified.next.portal.to.screen)).toBe("/discover");
    });

    it(`${name}: Google error offers Google again and the phone entry`, () => {
      const targets = [flow.googleError.primary, flow.googleError.secondary].map((action) => ("screen" in action.to ? hrefFor(action.to.screen) : null));
      expect(targets).toContain(`/${name}/google`);
      expect(targets).toContain(`/${name}`);
    });
  }

  it("the session-ended screen leads back to sign in", () => {
    const session = authFlows.signin.session!;
    const targets = [session.primary, session.secondary].map((action) => ("screen" in action.to ? hrefFor(action.to.screen) : null));
    expect(targets).toContain("/signin");
  });
});
