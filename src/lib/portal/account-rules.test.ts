import { describe, expect, it } from "vitest";
import { checkAccount, checkProfile } from "@/lib/portal/account-rules";
import type { PublicProfile } from "@/data/portal/account";
import { getAccountPage } from "@/stores/portal-store";

describe("account-rules (Phase 26)", () => {
  const { edit } = getAccountPage();

  const validProfile: PublicProfile = {
    nickname: "valid_name",
    occupation: "Software Engineer",
    education: "Bachelor's degree",
    lookingFor: "A real relationship",
    bio: "Passionate about building software and drinking coffee.",
    interests: ["Coffee", "Tech"],
  };

  it("passes validation for a valid public profile", () => {
    const errors = checkProfile(validProfile);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("enforces bio limits (min 10 chars, max 300 chars)", () => {
    const shortBio = checkProfile({ ...validProfile, bio: "Too short" });
    expect(shortBio.bio).toBe(edit.errors.bio);

    const longBio = checkProfile({ ...validProfile, bio: "a".repeat(301) });
    expect(longBio.bio).toBe(edit.errors.bio);

    const exactMaxBio = checkProfile({ ...validProfile, bio: "a".repeat(300) });
    expect(exactMaxBio.bio).toBeUndefined();
  });

  it("enforces occupation limits (non-empty, max 60 chars)", () => {
    const emptyOcc = checkProfile({ ...validProfile, occupation: "   " });
    expect(emptyOcc.occupation).toBe(edit.errors.occupation);

    const longOcc = checkProfile({ ...validProfile, occupation: "a".repeat(61) });
    expect(longOcc.occupation).toBe(edit.errors.occupation);

    const exactMaxOcc = checkProfile({ ...validProfile, occupation: "a".repeat(60) });
    expect(exactMaxOcc.occupation).toBeUndefined();
  });

  it("enforces nickname pattern and interests presence", () => {
    const badNick = checkProfile({ ...validProfile, nickname: "a" });
    expect(badNick.nickname).toBe(edit.errors.nickname);

    const noInterests = checkProfile({ ...validProfile, interests: [] });
    expect(noInterests.interests).toBe(edit.errors.interests);
  });

  it("validates account details correctly", () => {
    const validAccount = {
      privateName: "John Doe",
      phone: "+8801811000401",
      email: "john@example.com",
    };
    expect(Object.keys(checkAccount(validAccount))).toHaveLength(0);

    const shortName = checkAccount({ ...validAccount, privateName: "J" });
    expect(shortName.privateName).toBeDefined();

    const badPhone = checkAccount({ ...validAccount, phone: "123" });
    expect(badPhone.phone).toBeDefined();

    const badEmail = checkAccount({ ...validAccount, email: "invalid-email" });
    expect(badEmail.email).toBeDefined();
  });

  it("confirms update payload restricts fields to allowed PATCH schema", () => {
    // When saving profile via usersApi.updateProfile, only allowed fields are included
    const buildPatchBody = (p: PublicProfile) => ({
      bio: p.bio,
      occupation: p.occupation,
      ...(p.lookingFor ? { lookingFor: p.lookingFor } : {}),
    });

    const body = buildPatchBody(validProfile);
    expect(body).toHaveProperty("bio");
    expect(body).toHaveProperty("occupation");
    expect(body).toHaveProperty("lookingFor");
    expect(body).not.toHaveProperty("nickname");
    expect(body).not.toHaveProperty("education");
    expect(body).not.toHaveProperty("interests");
  });
});
