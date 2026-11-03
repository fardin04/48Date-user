import { notificationKeys, type NotificationPrefs, type PublicProfile, type ReportReason } from "@/data/portal/account";
import type { SelectOption } from "@/data/onboarding/types";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { authApi } from "@/lib/api/modules/auth-api";
import { notificationsApi } from "@/lib/api/modules/notifications-api";
import { storiesApi } from "@/lib/api/modules/stories-api";
import type { InboxNotification } from "@/lib/api/types/notifications";
import { memberPhoto } from "@/lib/portal/api-members";
import { to, toItem, type Destination } from "@/lib/routes";
import { trustApi } from "@/lib/api/modules/trust-api";
import { usersApi } from "@/lib/api/modules/users-api";
import type { ReportReasonGroup } from "@/lib/api/types/trust";
import type { LookingFor } from "@/lib/api/types/onboarding";
import type { MeData } from "@/lib/api/types/users";
import { fill } from "@/lib/format";
import { toStepOptions } from "@/lib/onboarding/options";
import type { AccountService, FieldErrors } from "@/lib/portal/account-service";
import { formatDayMonth } from "@/lib/portal/date-format";
import { mediaUrl } from "@/lib/portal/api-members";
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

/** Set once `GET /trust-score/history` answers 404, so the missing endpoint isn't asked again. */
let historyMissing = false;

/** Where a notification leads: its target screen, opened for the member it is about. */
function destinationOf(item: InboxNotification): Destination {
  const screen = (item.target?.screen ?? item.type ?? "").toUpperCase();
  const member = item.actor?.nickname;
  const story = item.target?.params?.storyId;
  // Without a story id (the consent request sends none) the stories feed is the closest screen.
  if (screen.includes("STORY")) return story ? toItem("STORY-DETAIL", story) : to("STORIES");
  if (screen.includes("TRUST") || screen.includes("WARNING") || screen.includes("VERIFICATION")) return to("TRUST");
  if (screen.includes("SUBSCRIPTION") || screen.includes("MEMBERSHIP") || screen.includes("PAYMENT")) return to("MEMBERSHIP");
  if (!member) return to("MATCHES");
  if (screen.includes("DATE")) return toItem("DATE-PENDING", member);
  if (screen.includes("GAME")) return toItem("GAMES", member);
  if (screen.includes("CHAT") || screen.includes("MESSAGE")) return toItem("CHAT-01", member);
  return toItem("MATCH-EXPIRING", member);
}

/** The Figma reasons, matched to the API's catalogue (`GET /reports/reasons`) by their wording. */
const reasonPatterns: Record<ReportReason, RegExp> = {
  messages: /harass|inappropriate|abus|offensive|message/i,
  fake: /fake|impersonat|catfish/i,
  noShow: /no.?show|didn.t (show|arrive|turn up)/i,
  money: /money|scam|financ/i,
  other: /other|something else/i,
};

function catalogueEntry(groups: ReportReasonGroup[], reason: ReportReason) {
  const all = groups.flatMap((group) => group.subReasons.map((sub) => ({ reason: group.reason, subReason: sub.name })));
  const pattern = reasonPatterns[reason];
  return (
    all.find((entry) => pattern.test(entry.subReason)) ??
    all.find((entry) => pattern.test(entry.reason)) ??
    all.find((entry) => reasonPatterns.other.test(`${entry.reason} ${entry.subReason}`)) ??
    all.at(-1) ??
    null
  );
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
  reportNeedsSubject: true,
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
      photoUrl: mediaUrl((me.photos.find((photo) => photo.isMain) ?? me.photos[0])?.url),
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
  // No endpoint reads or changes private details: show what `GET /users/me` has (the private name
  // isn't returned) and say so when saving rather than keeping a local copy.
  async getAccount() {
    const { data: me } = await usersApi.me();
    return { privateName: "", phone: me.phone ?? "", email: me.email ?? "" };
  },
  async saveAccount() {
    return { ok: false, errors: {}, message: getAccountPage().account.unavailable };
  },
  async getPhotos() {
    const { data: me } = await usersApi.me();
    return [...me.photos].sort((a, b) => a.position - b.position).flatMap(({ fileId, url }) => {
        const src = mediaUrl(url);
        return src ? [{ fileId, url: src }] : [];
      });
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
    const { live } = getAccountPage().trust;
    const signed = (points: number) => `${points > 0 ? "+" : ""}${points}`;
    if (!historyMissing) {
      try {
        const { data } = await usersApi.trustHistory();
        return data.map((event) => ({
          label: event.reason,
          value: fill(live.event, { change: event.isReversed ? live.reversed : signed(event.points), date: formatDayMonth(event.createdAt) }),
        }));
      } catch (error) {
        if (!(isApiError(error) && error.status === 404)) throw error;
        // This backend has no history endpoint (Postman `02` answers 404): use the score's breakdown.
        historyMissing = true;
      }
    }
    const { data } = await usersApi.trustScore();
    return [...data.breakdown.items]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((item) => ({ label: item.title, value: fill(live.event, { change: signed(item.points), date: formatDayMonth(item.createdAt) }) }));
  },
  async getNotificationPrefs() {
    const { data } = await usersApi.notificationSettings();
    return Object.fromEntries(notificationKeys.map((key) => [key, data[key]])) as NotificationPrefs;
  },
  async saveNotificationPrefs(prefs) {
    await usersApi.updateNotificationSettings(prefs);
  },
  requestTrustReview: mockAccountService.requestTrustReview,
  async report(subject, reason, details) {
    if (!subject) throw new Error("A report needs a member.");
    // Stories are reported through their author (the API reports members).
    const story = subject.kind === "story" ? (await storiesApi.detail(subject.id)).data : null;
    const reportedNickname = story ? story.author.nickname : subject.id;
    const [{ data: groups }] = await Promise.all([trustApi.reportReasons()]);
    const entry = catalogueEntry(groups, reason);
    if (!entry) throw new Error("Report reasons are unavailable.");
    const description = (story ? `${story.title}: ${details}` : details).slice(0, 500);
    await trustApi.report({ reportedNickname, reason: entry.reason, subReason: entry.subReason, description, source: "PROFILE" });
  },
  async getAvatar() {
    const { data: me } = await usersApi.me();
    const main = me.photos.find((photo) => photo.isMain) ?? me.photos[0];
    return memberPhoto(me.nickname, main?.url, getAccountPage().photo.alt);
  },
  async getNotifications() {
    const { data } = await notificationsApi.inbox();
    return data.map((item) => ({ id: item.id, title: item.title ?? "", description: item.body ?? "", to: destinationOf(item), unread: !item.readAt }));
  },
  async getUnreadCount() {
    return (await notificationsApi.unreadCount()).data.unreadCount;
  },
  async markNotificationsRead() {
    await notificationsApi.readAll();
  },
  async getSignInMethods() {
    const { data } = await authApi.methods();
    return { phone: data.phone, google: data.google?.email ?? null };
  },
  async linkGoogle(idToken) {
    await authApi.linkGoogle(idToken);
  },
  async unlinkGoogle() {
    await authApi.unlinkGoogle();
  },
  async sendLinkCode(phone) {
    await authApi.requestLinkPhone(phone);
  },
  async linkPhone(phone, code) {
    await authApi.verifyLinkPhone(phone, code);
  },
  async unlinkPhone() {
    await authApi.unlinkPhone();
  },
  async getWarnings() {
    const { data } = await trustApi.pendingWarnings();
    return data
      .filter((warning) => !warning.acknowledgedAt)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      .map(({ id, category, message }) => ({ id, category, message }));
  },
  async acknowledgeWarning(id) {
    await trustApi.acknowledgeWarning(id);
  },
  async requestDeletion() {
    await usersApi.deleteAccount();
  },
};
