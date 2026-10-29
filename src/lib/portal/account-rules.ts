import type { AccountDetails, PublicProfile } from "@/data/portal/account";
import { getAccountPage } from "@/stores/portal-store";
import type { FieldErrors } from "./account-service";

const NICKNAME = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]+$/;

/** Server-side profile rules (handoff: "Server validates profile changes"). */
export function checkProfile(profile: PublicProfile): FieldErrors<PublicProfile> {
  const { edit } = getAccountPage();
  const errors: FieldErrors<PublicProfile> = {};
  if (!NICKNAME.test(profile.nickname)) errors.nickname = edit.errors.nickname;
  if (!profile.occupation.trim()) errors.occupation = edit.errors.occupation;
  if (profile.bio.trim().length < 10) errors.bio = edit.errors.bio;
  if (profile.interests.length === 0) errors.interests = edit.errors.interests;
  return errors;
}

export function checkAccount(account: AccountDetails): FieldErrors<AccountDetails> {
  const { errors: copy } = getAccountPage().account;
  const errors: FieldErrors<AccountDetails> = {};
  const digits = account.phone.replace(/\D/g, "").length;
  if (account.privateName.trim().length < 2) errors.privateName = copy.privateName;
  if (!PHONE.test(account.phone.trim()) || digits < 7 || digits > 15) errors.phone = copy.phone;
  if (!EMAIL.test(account.email.trim())) errors.email = copy.email;
  return errors;
}
