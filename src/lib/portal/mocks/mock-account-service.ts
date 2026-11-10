import { notificationKeys, type AccountDetails, type NotificationPrefs, type PublicProfile } from "@/data/portal/account";
import { getAccountPage, getMemberAvatar } from "@/stores/portal-store";
import type { AccountService } from "@/lib/portal/account-service";
import { checkAccount, checkProfile } from "@/lib/portal/account-rules";
import { nearestArea, searchAreaList } from "@/lib/onboarding/area-search";

/**
 * MOCK — stands in for the profile API so every W09 state can be reviewed.
 * Not for production: replace `accountService` in ./account-service.ts.
 *
 * - Profile, account details, the area and notification choices live in sessionStorage for this tab,
 *   validated on read; photos, reports, trust reviews and deletion requests are not kept.
 * - Every write fails while the browser is offline (the forms keep their values).
 * - Saves run the same rules the forms check first (./account-rules.ts), as the server would.
 */
const STORAGE_KEY = "48date.mock.account";
const LATENCY_MS = 700;

type Stored = { profile: PublicProfile; account: AccountDetails; notifications: NotificationPrefs; area: string | null };

const AREA_MAX = 80;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, fallback: string, max: number) => (typeof value === "string" ? value.slice(0, max) : fallback);

function validProfile(value: unknown): PublicProfile {
  const { defaults, edit } = getAccountPage();
  if (!isRecord(value)) return defaults.profile;
  const pick = (current: unknown, options: { value: string }[], fallback: string) =>
    options.some((option) => option.value === current) ? (current as string) : fallback;
  const interests = Array.isArray(value.interests) ? value.interests.filter((item): item is string => edit.interestOptions.includes(item as string)) : [];
  return {
    nickname: text(value.nickname, defaults.profile.nickname, edit.limits.nickname),
    occupation: text(value.occupation, defaults.profile.occupation, edit.limits.occupation),
    education: pick(value.education, edit.educationOptions, defaults.profile.education),
    lookingFor: pick(value.lookingFor, edit.lookingForOptions, defaults.profile.lookingFor),
    bio: text(value.bio, defaults.profile.bio, edit.limits.bio),
    interests: interests.length > 0 ? interests : defaults.profile.interests,
  };
}

function validAccount(value: unknown): AccountDetails {
  const { defaults, account } = getAccountPage();
  if (!isRecord(value)) return defaults.account;
  return {
    privateName: text(value.privateName, "", account.limits.privateName),
    phone: text(value.phone, "", account.limits.phone),
    email: text(value.email, "", account.limits.email),
  };
}

function validNotifications(value: unknown): NotificationPrefs {
  const { notifications } = getAccountPage().defaults;
  if (!isRecord(value)) return notifications;
  return Object.fromEntries(notificationKeys.map((key) => [key, typeof value[key] === "boolean" ? value[key] : notifications[key]])) as NotificationPrefs;
}

function read(): Stored {
  let value: unknown = null;
  try {
    value = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    // Unreadable: start from the samples.
  }
  const stored = isRecord(value) ? value : {};
  return {
    profile: validProfile(stored.profile),
    account: validAccount(stored.account),
    notifications: validNotifications(stored.notifications),
    area: typeof stored.area === "string" && stored.area !== "" ? stored.area.slice(0, AREA_MAX) : null,
  };
}

function write(change: Partial<Stored>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), ...change }));
  } catch {
    // Blocked storage: nothing is kept beyond this page.
  }
}

/** Waits like a network call, then fails while offline. */
async function send() {
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  if (!navigator.onLine) throw new Error("Offline");
}

export const mockAccountService: AccountService = {
  reportNeedsSubject: false,
  editable: { education: true, interests: true },
  async getOverview() {
    const { defaults, profile: page } = getAccountPage();
    const profile = read().profile;
    const { facts, labels } = page;
    return {
      nickname: profile.nickname,
      age: defaults.age,
      area: read().area,
      bio: profile.bio,
      interests: profile.interests,
      facts: [
        facts.height,
        facts.weight,
        facts.smoking,
        facts.alcohol,
        facts.children,
        facts.family,
        facts.religion,
        { label: labels.occupation, value: profile.occupation },
        { label: labels.education, value: profile.education },
        facts.languages,
        { label: labels.lookingFor, value: profile.lookingFor },
      ],
      photoUrl: null,
      trust: page.trust.value,
      completeness: null,
    };
  },
  async getProfile() {
    return read().profile;
  },
  async saveProfile(profile) {
    await send();
    const errors = checkProfile(profile);
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    write({ profile: validProfile(profile) });
    return { ok: true };
  },
  async getAccount() {
    return read().account;
  },
  async saveAccount(account) {
    await send();
    const errors = checkAccount(account);
    if (Object.keys(errors).length > 0) return { ok: false, errors };
    write({ account: validAccount(account) });
    return { ok: true };
  },
  async getLocation() {
    return read().area;
  },
  async saveLocation(choice) {
    await send().catch(() => {
      throw new Error(getAccountPage().location.failed);
    });
    const area = choice.kind === "area" ? choice.area.name : (nearestArea(choice.latitude, choice.longitude)?.name ?? getAccountPage().location.nearYou);
    write({ area });
    return area;
  },
  async searchAreas(query) {
    return searchAreaList(query);
  },
  async getPhotos() {
    return [{ url: getAccountPage().photo.src }];
  },
  async savePhotos() {
    await send();
  },
  async getTrust() {
    const { trust } = getAccountPage();
    return { title: trust.card.title, verification: null, dates: trust.values.dates, feedback: trust.values.feedback };
  },
  async getTrustHistory() {
    return getAccountPage().trustHistory.events;
  },
  async getNotificationPrefs() {
    return read().notifications;
  },
  async saveNotificationPrefs(prefs) {
    await send();
    write({ notifications: validNotifications(prefs) });
  },
  async requestTrustReview() {
    await send();
  },
  async report() {
    await send();
  },
  async getAvatar() {
    return getMemberAvatar();
  },
  async getNotifications() {
    return getAccountPage().notifications.items.map((item, index) => ({ id: String(index), title: item.title, description: item.description, to: item.to, unread: false, at: null }));
  },
  async getUnreadCount() {
    return 0;
  },
  async markNotificationsRead() {},
  async getSignInMethods() {
    return null;
  },
  async linkGoogle() {},
  async unlinkGoogle() {},
  async sendLinkCode() {},
  async linkPhone() {},
  async unlinkPhone() {},
  async getWarnings() {
    return [];
  },
  async acknowledgeWarning() {},
  async requestDeletion() {
    await send();
  },
};
