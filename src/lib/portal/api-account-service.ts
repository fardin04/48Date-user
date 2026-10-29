import { notificationKeys, type NotificationPrefs, type PublicProfile } from "@/data/portal/account";
import type { SelectOption } from "@/data/onboarding/types";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { usersApi } from "@/lib/api/modules/users-api";
import type { LookingFor } from "@/lib/api/types/onboarding";
import type { MeData } from "@/lib/api/types/users";
import { fill } from "@/lib/format";
import { toStepOptions } from "@/lib/onboarding/options";
import type { AccountService, FieldErrors } from "@/lib/portal/account-service";
import { formatDayMonth } from "@/lib/portal/date-format";
import { mockAccountService } from "@/lib/portal/mocks/mock-account-service";
import { getAccountPage } from "@/stores/portal-store";

/** Option lists for enum labels ("NEVER" → "Never"); cached for an hour by the API module. */
const optionLists = () =>
  onboardingApi
    .options()
    .then(({ data }) => toStepOptions(data).fields)
    .catch(() => null);

function labelOf(list: SelectOption[] | undefined, value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return getAccountPage().profile.values.missing;
  return list?.find((option) => option.value === value)?.label ?? value;
}

const failureMessage = (error: unknown) => (isApiError(error) ? error.message : getAccountPage().account.failed);

function toPublicProfile(me: MeData): PublicProfile {
  return {
    nickname: me.nickname,
    occupation: me.occupation ?? "",
    education: me.educationLevel ?? "",
    lookingFor: me.lookingFor ?? "",
    bio: me.bio ?? "",
    interests: me.interests.map((interest) => interest.label),
  };
}

/**
 * User / 02 - Users (own profile), 11 - Trust & Safety (score), 12 - Notifications (settings).
 * The API has no endpoints yet for private account details, trust reviews or reports in this
 * phase; those calls stay on the marked mock.
 */
export const apiAccountService: AccountService = {
  // `PATCH /users/me/profile` takes bio, occupation, smoking, drinking and lookingFor only.
  editable: { education: false, interests: false },
  async getOverview() {
    const [{ data: me }, lists, trust] = await Promise.all([usersApi.me(), optionLists(), usersApi.trustScore().catch(() => null)]);
    const { profile: page } = getAccountPage();
    const { facts, labels, values } = page;
    const yesNo = (flag: boolean | null, yes: string, no: string) => (flag === null ? values.missing : flag ? yes : no);
    return {
      nickname: me.nickname,
      age: me.age,
      area: me.location?.city ?? null,
      bio: me.bio ?? "",
      interests: me.interests.map((interest) => interest.label),
      facts: [
        { label: facts.height.label, value: me.heightCm ? fill(values.height, { value: me.heightCm }) : values.missing },
        { label: facts.weight.label, value: me.weightKg ? fill(values.weight, { value: me.weightKg }) : values.missing },
        { label: facts.smoking.label, value: labelOf(lists?.smoking, me.smoking) },
        { label: facts.alcohol.label, value: labelOf(lists?.alcohol, me.drinking) },
        { label: facts.children.label, value: yesNo(me.hasKids, values.hasKids, values.noKids) },
        { label: facts.family.label, value: yesNo(me.wantsKids, values.wantsKids, values.noWantsKids) },
        { label: facts.religion.label, value: labelOf(lists?.religion, me.religion) },
        { label: labels.occupation, value: me.occupation ?? values.missing },
        { label: labels.education, value: labelOf(lists?.education, me.educationLevel) },
        { label: facts.languages.label, value: me.languageCodes.length ? me.languageCodes.map((code) => labelOf(lists?.languages, code)).join(" · ") : values.missing },
        { label: labels.lookingFor, value: labelOf(lists?.goal, me.lookingFor) },
      ],
      photoUrl: (me.photos.find((photo) => photo.isMain) ?? me.photos[0])?.url ?? null,
      trust: trust ? fill(page.trustValue, { value: trust.data.value.toFixed(1), label: trust.data.label }) : values.missing,
      completeness: me.profileCompletenessPercent,
    };
  },
  async getProfile() {
    return toPublicProfile((await usersApi.me()).data);
  },
  async saveProfile(profile) {
    try {
      await usersApi.updateProfile({
        bio: profile.bio,
        occupation: profile.occupation,
        ...(profile.lookingFor ? { lookingFor: profile.lookingFor as LookingFor } : {}),
      });
      return { ok: true };
    } catch (error) {
      if (!isApiError(error)) throw error;
      const errors: FieldErrors<PublicProfile> = {};
      for (const key of ["bio", "occupation", "lookingFor", "nickname"] as const) if (error.fields[key]) errors[key] = error.fields[key];
      return { ok: false, errors, message: Object.keys(errors).length ? undefined : error.message };
    }
  },
  getAccount: mockAccountService.getAccount,
  saveAccount: mockAccountService.saveAccount,
  async getPhotos() {
    const { data: me } = await usersApi.me();
    return [...me.photos].sort((a, b) => a.position - b.position).map(({ fileId, url }) => ({ fileId, url }));
  },
  async savePhotos(photos) {
    try {
      const refs = [];
      for (const photo of photos) {
        const fileId = photo.fileId ?? (photo.file ? (await onboardingApi.upload(photo.file, "PROFILE_PHOTO", () => undefined)).fileId : undefined);
        if (fileId) refs.push({ fileId, isMain: refs.length === 0 });
      }
      await usersApi.updatePhotos(refs);
    } catch (error) {
      throw new Error(failureMessage(error));
    }
  },
  async getTrust() {
    const { data } = await usersApi.trustScore();
    const { trust } = getAccountPage();
    const rating = data.breakdown.items.find((item) => item.type === "RATING");
    return {
      title: fill(trust.live.cardTitle, { value: data.value.toFixed(1) }),
      verification: data.isVerified ? trust.verification.verified : trust.verification.none,
      dates: fill(trust.live.dates, { count: data.completedDatesCount }),
      feedback: rating?.title ?? trust.live.noFeedback,
    };
  },
  async getTrustHistory() {
    const { data } = await usersApi.trustHistory();
    return data.map((event) => ({
      label: event.reason,
      value: fill(getAccountPage().trust.live.event, {
        change: event.isReversed ? getAccountPage().trust.live.reversed : `${event.points > 0 ? "+" : ""}${event.points}`,
        date: formatDayMonth(event.createdAt),
      }),
    }));
  },
  async getNotificationPrefs() {
    const { data } = await usersApi.notificationSettings();
    return Object.fromEntries(notificationKeys.map((key) => [key, data[key]])) as NotificationPrefs;
  },
  async saveNotificationPrefs(prefs) {
    await usersApi.updateNotificationSettings(prefs);
  },
  requestTrustReview: mockAccountService.requestTrustReview,
  report: mockAccountService.report,
  async requestDeletion() {
    await usersApi.deleteAccount();
  },
};
