import { describe, expect, it } from "vitest";
import { formatRetry } from "./use-retry-countdown";

/** B7: the OTP countdown reads like a clock, with hours for the hourly / daily limits. */
describe("formatRetry", () => {
  it("shows minutes and seconds under an hour", () => {
    expect(formatRetry(42)).toBe("0:42");
    expect(formatRetry(65)).toBe("1:05");
    expect(formatRetry(3599)).toBe("59:59");
  });

  it("adds hours from an hour up", () => {
    expect(formatRetry(3600)).toBe("1:00:00");
    expect(formatRetry(86399)).toBe("23:59:59");
  });
});
