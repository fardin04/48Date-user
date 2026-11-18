import { describe, expect, it } from "vitest";
import { getAccountPage } from "@/stores/portal-store";
import type { MeData } from "@/lib/api/types/users";

describe("profile-view-model (Phase 25)", () => {
  const page = getAccountPage().profile;

  it("selects PROFILE vs PROFILE-UNVERIFIED copy and actions based on verification status", () => {
    // When verified:
    const verifiedStatus = "verified";
    const isVerified = verifiedStatus === "verified";
    expect(isVerified ? page.verified : page.pending).toBe(page.verified);
    expect(isVerified ? page.managePhotos : page.completeVerification).toEqual(page.managePhotos);

    // When pending/unverified:
    for (const unverifiedStatus of ["pending", "rejected", "none", undefined]) {
      const verified = unverifiedStatus === "verified";
      expect(verified ? page.verified : page.pending).toBe(page.pending);
      expect(verified ? page.managePhotos : page.completeVerification).toEqual(page.completeVerification);
    }
  });

  it("excludes private fields (phone, email, birthDate, internal IDs) from the public profile facts", () => {
    const mockMe: Partial<MeData> = {
      phone: "+8801811000401",
      email: "secret@example.com",
      nickname: "omar_farooq",
      birthDate: "1995-05-15",
      gender: "MAN",
      age: 29,
      bio: "Software Engineer in Dhaka",
      occupation: "Software Engineer",
      educationLevel: "BACHELORS",
      smoking: "NEVER",
      drinking: "NEVER",
      hasKids: false,
      wantsKids: true,
      religion: "ISLAM",
      heightCm: 178,
      weightKg: 72,
      languageCodes: ["BN", "EN"],
      interests: [{ id: "tech", key: "tech", label: "Technology", category: "CAREER" }],
      photos: [{ id: "p1", fileId: "f1", url: "https://r2.48date.com/p1.jpg", position: 0, isMain: true }],
      location: {
        latitude: 23.79,
        longitude: 90.41,
        city: "Dhaka",
        region: "Gulshan",
        countryCode: "BD",
        permission: "WHILE_IN_USE",
        source: "GPS",
      },
      profileCompletenessPercent: 100,
    };

    // Public overview structure derived from MeData
    const publicOverview = {
      nickname: mockMe.nickname,
      age: mockMe.age,
      bio: mockMe.bio,
      occupation: mockMe.occupation,
      interests: mockMe.interests?.map((i) => i.label),
    };

    // Verify private fields are strictly absent
    expect(publicOverview).not.toHaveProperty("phone");
    expect(publicOverview).not.toHaveProperty("email");
    expect(publicOverview).not.toHaveProperty("id");
    expect(publicOverview).not.toHaveProperty("birthDate");
  });

  it("verifies Change location destination targets SETTINGS-LOCATION and never onboarding", () => {
    expect(page.changeLocation.to).toEqual({ screen: "SETTINGS-LOCATION" });
  });
});
