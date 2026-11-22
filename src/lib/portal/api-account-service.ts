import { notificationKeys, type NotificationPrefs, type ProfilePhoto, type PublicProfile, type ReportReason } from "@/data/portal/account";
import type { SelectOption } from "@/data/onboarding/types";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { authApi } from "@/lib/api/modules/auth-api";
import { chatApi } from "@/lib/api/modules/chat-api";
import { notificationsApi } from "@/lib/api/modules/notifications-api";
import { storiesApi } from "@/lib/api/modules/stories-api";
import type { InboxNotification } from "@/lib/api/types/notifications";
import { memberPhoto } from "@/lib/portal/api-members";
import { to, toItem, type Destination } from "@/lib/routes";
import { trustApi } from "@/lib/api/modules/trust-api";
import { usersApi } from "@/lib/api/modules/users-api";
import type { ReportReasonGroup } from "@/lib/api/types/trust";
import type { LookingFor } from "@/lib/api/types/onboarding";
import type { MeData, UpdateLocationBody } from "@/lib/api/types/users";
import { fill } from "@/lib/format";
import { nearestArea, searchAreaList } from "@/lib/onboarding/area-search";
import { toStepOptions } from "@/lib/onboarding/options";
import { approximate } from "@/lib/onboarding/step-payloads";
import type { ImageAsset } from "@/data/types";
import { cacheKeys } from "@/lib/api/modules/cache-keys";
import { invalidate } from "@/lib/api/cache";
import { acquireSocket } from "@/lib/api/socket";
import { screenKeys } from "@/lib/screen-keys";
import type { AccountService, FieldErrors, LocationChoice, NotificationItem } from "@/lib/portal/account-service";
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

/** Where a notification leads: its target screen, opened for the member it is about. */
export function destinationOf(item: InboxNotification): Destination | null {
  const screen = (item.target?.screen ?? item.type ?? "").toUpperCase();
  const member = item.actor?.nickname;
  const story = item.target?.params?.storyId;
  if (screen === "NONE" || item.type === "REPORT_REVIEWED" || item.type === "ANNOUNCEMENT") return null;
  // Without a story id (the consent request sends none) the stories feed is the closest screen.
  if (screen.includes("STORY")) return story ? toItem("STORY-DETAIL", story) : to("STORIES");
  if (screen.includes("TRUST") || screen.includes("WARNING") || screen.includes("VERIFICATION")) return to("TRUST");
  if (screen.includes("SUBSCRIPTION") || screen.includes("MEMBERSHIP") || screen.includes("PAYMENT")) return to("MEMBERSHIP");
  if (screen.includes("RATE_DATE") || screen.includes("DATE_RATE")) {
    return member ? toItem("FEEDBACK", member) : to("MATCHES");
  }
  if (!member) return null;
  if (screen.includes("DATE")) return toItem("DATE-PENDING", member);
  if (screen.includes("GAME")) return toItem("GAMES", member);
  if (screen.includes("CHAT") || screen.includes("MESSAGE")) return toItem("CHAT-01", member);
  if (screen.includes("MATCH")) return toItem("MATCH-EXPIRING", member);
  return null;
}

function toNotificationItem(item: InboxNotification): NotificationItem {
  const photoUrl = mediaUrl(item.actor?.mainPhotoUrl ?? item.imageUrl);
  const avatar: ImageAsset | null = photoUrl
    ? { src: photoUrl, alt: item.actor?.nickname ?? item.title ?? "Notification", width: 48, height: 48 }
    : null;
  return {
    id: item.id,
    title: item.title ?? "",
    description: item.body ?? "",
    to: destinationOf(item),
    unread: !item.readAt,
    at: Date.parse(item.createdAt) || null,
    avatar,
  };
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

/** The area a saved location is shown as: its city, or "near you" for a position with no name. */
const areaOf = (location: Pick<NonNullable<MeData["location"]>, "city"> | null | undefined) =>
  location ? location.city || getAccountPage().location.nearYou : null;

/**
 * `PATCH /users/me/location` merges what it is sent: a field left out keeps its saved value and `null`
 * erases it (B5: an erased city leaves discovery cards without an area). So only known names are sent,
 * never null. The API doesn't geocode: a device position is named after the starter area it falls in,
 * when there is one; otherwise only the coordinates go and the saved city stays.
 */
export function locationBody(choice: LocationChoice): UpdateLocationBody {
  if (choice.kind === "area") {
    const [latitude, longitude] = choice.area.center;
    return {
      latitude: approximate(latitude),
      longitude: approximate(longitude),
      city: choice.area.name,
      countryCode: choice.area.countryCode,
      source: "MANUAL",
    };
  }
  const near = nearestArea(choice.latitude, choice.longitude);
  return {
    latitude: approximate(choice.latitude),
    longitude: approximate(choice.longitude),
    ...(near ? { city: near.name, countryCode: near.countryCode } : {}),
    permission: "WHILE_IN_USE",
    source: "GPS",
  };
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
/**
 * PHOTO-MANAGE "Save photos" through the gallery endpoints (39–45), as the difference from what the API
 * holds: new files go up in one batch and are attached (the first slot as main), a kept photo moved to
 * the first slot becomes main, and photos taken out are deleted last (the main photo can't be deleted, and
 * the gallery never drops below its minimum while photos are swapped).
 * shortcut: the API has no reorder endpoint, so only the main photo's place is saved; others keep theirs.
 */
async function saveGallery(photos: ProfilePhoto[]) {
  const { data: gallery } = await usersApi.myPhotos();
  const kept = new Set(photos.flatMap((photo) => (photo.id ? [photo.id] : [])));
  const removed = gallery.items.filter((item) => !kept.has(item.id)).map((item) => item.id);
  const files = photos.flatMap((photo) => (!photo.id && !photo.fileId && photo.file ? [photo.file] : []));
  const uploaded = files.length > 0 ? (await usersApi.uploadPhotos(files)).items : [];
  let next = 0;
  const attach = photos.flatMap((photo, index) => {
    if (photo.id) return [];
    const fileId = photo.fileId ?? (photo.file ? uploaded[next++]?.fileId : undefined);
    return fileId ? [{ fileId, isMain: index === 0 }] : [];
  });
  if (attach.length > 0) await usersApi.attachPhotos(attach);
  const main = photos[0]?.id;
  if (main && main !== gallery.items.find((item) => item.isMain)?.id) await usersApi.setMainPhoto(main);
  if (removed.length > 0) await usersApi.deletePhotos(removed);
}

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
      area: areaOf(me.location),
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
      photoUrl: mediaUrl(me.mainPhotoUrl ?? (me.photos?.find((photo) => photo.isMain) ?? me.photos?.[0])?.url ?? null),
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
      invalidate(cacheKeys.me, screenKeys.profile, screenKeys.avatar, screenKeys.overview);
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
  async getLocation() {
    const { data: me } = await usersApi.me();
    return areaOf(me.location);
  },
  async saveLocation(choice) {
    try {
      const { data } = await usersApi.updateLocation(locationBody(choice));
      invalidate(cacheKeys.me, screenKeys.location, screenKeys.profile, screenKeys.overview, cacheKeys.discoveryRun);
      return areaOf(data) ?? getAccountPage().location.nearYou;
    } catch (error) {
      throw new Error(isApiError(error) ? error.message : getAccountPage().location.failed);
    }
  },
  async searchAreas(query) {
    return searchAreaList(query);
  },
  async getPhotos() {
    const { data } = await usersApi.myPhotos();
    return data.items.flatMap(({ id, fileId, url }) => {
      const src = mediaUrl(url);
      return src ? [{ id, fileId, url: src }] : [];
    });
  },
  async savePhotos(photos) {
    try {
      await saveGallery(photos);
    } catch (error) {
      throw new Error(failureMessage(error));
    } finally {
      // A partly applied change (e.g. attached, then a delete refused) still shows as it is now.
      invalidate(cacheKeys.me, screenKeys.photos, screenKeys.avatar, screenKeys.overview);
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
    // The API has no history endpoint: the score's breakdown lists what changed it.
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
    invalidate(screenKeys.notificationPrefs);
  },
  requestTrustReview: mockAccountService.requestTrustReview,
  async report(subject, reason, details, options) {
    if (!subject) throw new Error("A report needs a member.");
    // Stories are reported through their author (the API reports members).
    const story = subject.kind === "story" ? (await storiesApi.detail(subject.id)).data : null;
    const reportedNickname = story ? story.author.nickname : subject.id;
    const [{ data: groups }] = await Promise.all([trustApi.reportReasons()]);
    const entry = catalogueEntry(groups, reason);
    if (!entry) throw new Error("Report reasons are unavailable.");
    const description = (story ? `${story.title}: ${details}` : details).slice(0, 500);
    const source = options?.source ?? (story ? "PROFILE" : "PROFILE");
    let conversationId = options?.conversationId;
    if (source === "CHAT" && !conversationId) {
      try {
        const { data: convs } = await chatApi.list();
        conversationId = convs.find((c) => c.partner?.nickname === reportedNickname)?.id;
      } catch {
        // Fallback without conversationId
      }
    }
    await trustApi.report({
      reportedNickname,
      reason: entry.reason,
      subReason: entry.subReason,
      description,
      source,
      conversationId: conversationId ?? undefined,
      dateId: options?.dateId ?? undefined,
      alsoBlock: options?.alsoBlock ?? undefined,
    });
  },
  async getAvatar() {
    const { data: me } = await usersApi.me();
    const main = me.photos?.find((photo) => photo.isMain) ?? me.photos?.[0];
    const url = me.mainPhotoUrl ?? main?.url;
    return memberPhoto(me.nickname, url, getAccountPage().photo.alt);
  },
  async getNotifications() {
    const page = await this.getNotificationsPage();
    return page.items;
  },
  async getNotificationsPage(cursor) {
    const { data, meta } = await notificationsApi.inbox(cursor ?? undefined);
    return {
      items: data.map(toNotificationItem),
      next: meta?.nextCursor ?? null,
    };
  },
  async getUnreadCount() {
    return (await notificationsApi.unreadCount()).data.unreadCount;
  },
  watchNotifications() {
    // One new inbox item per event: the badge and the inbox re-read (the bell is on every portal page).
    const handle = acquireSocket();
    const refresh = () => invalidate(cacheKeys.notifications);
    handle.socket.on("notification:new", refresh);
    return () => {
      handle.socket.off("notification:new", refresh);
      handle.release();
    };
  },
  async markNotificationsRead() {
    await notificationsApi.readAll();
    invalidate(screenKeys.unreadCount, screenKeys.notifications);
  },
  async deleteNotification(id: string) {
    await notificationsApi.deleteNotification(id);
    invalidate(screenKeys.unreadCount, screenKeys.notifications);
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
