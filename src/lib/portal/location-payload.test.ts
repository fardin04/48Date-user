import { describe, expect, it } from "vitest";
import { locationBody } from "./api-account-service";
import { nearestArea } from "@/lib/onboarding/area-search";
import type { Area } from "@/data/onboarding/types";

describe("location payload and rules (Phase 28)", () => {
  const sampleArea: Area = {
    id: "dhanmondi",
    name: "Dhanmondi",
    region: "Dhaka",
    countryCode: "BD",
    label: "Dhanmondi, Dhaka",
    center: [23.746123, 90.374245],
  };

  it("rounds coordinates to 0.01 degrees for manual area choices", () => {
    const payload = locationBody({ kind: "area", area: sampleArea });
    expect(payload.latitude).toBe(23.75);
    expect(payload.longitude).toBe(90.37);
    expect(payload.source).toBe("MANUAL");
    expect(payload.city).toBe("Dhanmondi");
    expect(payload.region).toBeNull();
    expect(payload.countryCode).toBe("BD");
  });

  it("rounds coordinates to 0.01 degrees for GPS device choices and marks source GPS", () => {
    // Banani / Gulshan area coordinates
    const payload = locationBody({ kind: "device", latitude: 23.793741, longitude: 90.406612 });
    expect(payload.latitude).toBe(23.79);
    expect(payload.longitude).toBe(90.41);
    expect(payload.source).toBe("GPS");
    expect(payload.permission).toBe("WHILE_IN_USE");
    expect(payload.region).toBeNull();
    expect(payload.city).toBeTruthy();
  });

  it("names nearest starter area when GPS coordinates are within 30 km", () => {
    // Very close to Banani (23.7925, 90.4078)
    const near = nearestArea(23.795, 90.405);
    expect(near).not.toBeNull();
    expect(["Banani", "Gulshan"]).toContain(near?.name);
  });

  it("sets city to null when GPS coordinates are in the middle of the ocean (>30 km from any starter area)", () => {
    const farLatitude = 0.0;
    const farLongitude = 0.0;
    const near = nearestArea(farLatitude, farLongitude);
    expect(near).toBeNull();

    const payload = locationBody({ kind: "device", latitude: farLatitude, longitude: farLongitude });
    expect(payload.city).toBeNull();
    expect(payload.region).toBeNull();
    expect(payload.countryCode).toBeNull();
    expect(payload.source).toBe("GPS");
  });

  it("clears region to null in all updates so old region is never kept", () => {
    const manual = locationBody({ kind: "area", area: sampleArea });
    const gps = locationBody({ kind: "device", latitude: 23.75, longitude: 90.37 });
    expect(manual.region).toBeNull();
    expect(gps.region).toBeNull();
  });
});
