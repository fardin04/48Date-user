import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authFlows } from "@/data/auth/flows";
import { hrefFor } from "@/lib/routes";
import { phoneSession } from "./phone";
import { setupStatus } from "./setup-status";
import { authStepParams, resolveAuthStep } from "./steps";

function createStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe("auth steps routing and fallbacks", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
    vi.stubGlobal("sessionStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("resolveAuthStep", () => {
    it("resolves all signup step URLs to their step names", () => {
      const flow = authFlows.signup;
      expect(resolveAuthStep("signup", flow, [])).toBe("entry");
      expect(resolveAuthStep("signup", flow, ["verify"])).toBe("verify");
      expect(resolveAuthStep("signup", flow, ["verified"])).toBe("verified");
      expect(resolveAuthStep("signup", flow, ["google"])).toBe("google");
      expect(resolveAuthStep("signup", flow, ["google", "error"])).toBe("googleError");
      expect(resolveAuthStep("signup", flow, ["unknown"])).toBeNull();
    });

    it("resolves all signin step URLs to their step names", () => {
      const flow = authFlows.signin;
      expect(resolveAuthStep("signin", flow, [])).toBe("entry");
      expect(resolveAuthStep("signin", flow, ["verify"])).toBe("verify");
      expect(resolveAuthStep("signin", flow, ["verified"])).toBe("verified");
      expect(resolveAuthStep("signin", flow, ["google"])).toBe("google");
      expect(resolveAuthStep("signin", flow, ["google", "error"])).toBe("googleError");
      expect(resolveAuthStep("signin", flow, ["session-ended"])).toBe("session");
    });

    it("generates static params covering all route steps", () => {
      const signupParams = authStepParams("signup", authFlows.signup);
      expect(signupParams).toContainEqual({ step: [] });
      expect(signupParams).toContainEqual({ step: ["verify"] });
      expect(signupParams).toContainEqual({ step: ["verified"] });
      expect(signupParams).toContainEqual({ step: ["google"] });
      expect(signupParams).toContainEqual({ step: ["google", "error"] });

      const signinParams = authStepParams("signin", authFlows.signin);
      expect(signinParams).toContainEqual({ step: [] });
      expect(signinParams).toContainEqual({ step: ["verify"] });
      expect(signinParams).toContainEqual({ step: ["session-ended"] });
    });
  });

  describe("verify step direct entry fallback", () => {
    it("reports null when no phone was stored in session", () => {
      expect(phoneSession.read()).toBeNull();
    });

    it("identifies entry route as fallback for verify steps", () => {
      expect(hrefFor(authFlows.signup.routes.entry)).toBe("/signup");
      expect(hrefFor(authFlows.signin.routes.entry)).toBe("/signin");
    });
  });

  describe("setup routing based on onboardingStatus", () => {
    it("routes COMPLETED accounts to Open my portal (DISCOVER)", () => {
      setupStatus.fromApi("COMPLETED");
      const next = setupStatus.read();
      expect(next).toBe("portal");

      const signupNext = authFlows.signup.verified.next[next!];
      expect(signupNext.label).toBe("Open my portal");
      expect(hrefFor(signupNext.to.screen)).toBe("/discover");

      const signinNext = authFlows.signin.verified.next[next!];
      expect(signinNext.label).toBe("Open my portal");
      expect(hrefFor(signinNext.to.screen)).toBe("/discover");
    });

    it("routes NOT_STARTED accounts to Set up my profile (LOCATION)", () => {
      setupStatus.fromApi("NOT_STARTED");
      const next = setupStatus.read();
      expect(next).toBe("onboarding");

      const signupNext = authFlows.signup.verified.next[next!];
      expect(signupNext.label).toBe("Set up my profile");
      expect(hrefFor(signupNext.to.screen)).toBe("/onboarding/location");
    });

    it("routes IN_PROGRESS accounts to Finish setting up my profile (LOCATION)", () => {
      setupStatus.fromApi("IN_PROGRESS");
      const next = setupStatus.read();
      expect(next).toBe("onboarding");

      const signinNext = authFlows.signin.verified.next[next!];
      expect(signinNext.label).toBe("Finish setting up my profile");
      expect(hrefFor(signinNext.to.screen)).toBe("/onboarding/location");
    });
  });
});
