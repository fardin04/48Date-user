import type { SelectOption } from "@/data/onboarding/types";
import type { Fact, Member, MemberSummary } from "@/data/portal/types";
import type { ImageAsset } from "@/data/types";
import { mediaBaseUrl } from "@/lib/api/config";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import type { DiscoveryProfile, InterestTag, TrustBadge } from "@/lib/api/types/discovery";
import { fill } from "@/lib/format";
import { toStepOptions } from "@/lib/onboarding/options";
import { getMemberCopy } from "@/stores/portal-store";

const KM_PER_MILE = 1.609344;

/**
 * A photo URL the browser may load: absolute http(s) URLs as they are, storage keys under
 * `NEXT_PUBLIC_MEDIA_BASE_URL`; anything else (another scheme, no media host) is dropped.
 */
export function mediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || !mediaBaseUrl) return null;
  return `${mediaBaseUrl}/${value.replace(/^\/+/, "")}`;
}

export function memberPhoto(name: string, url: string | null | undefined, alt = getMemberCopy().photoAlt): ImageAsset {
  const copy = getMemberCopy();
  const src = mediaUrl(url);
  return src ? { src, alt: fill(alt, { name }), width: 720, height: 960 } : { ...copy.placeholder, alt: fill(alt, { name }) };
}

/** A list row's member: nickname (the public name), age, main photo, verification. */
export function toSummary(user: { nickname: string; age?: number | null; mainPhotoUrl?: string | null; isVerified?: boolean }): MemberSummary {
  return {
    id: user.nickname,
    name: user.nickname,
    age: user.age ?? null,
    photo: memberPhoto(user.nickname, user.mainPhotoUrl),
    verified: user.isVerified ?? false,
  };
}

/** "4 km" → "3 miles away" (the portal speaks miles); the API rounds up and never sends coordinates. */
export function distanceText(km: number | null | undefined) {
  const copy = getMemberCopy().distance;
  if (km === null || km === undefined) return copy.hidden;
  const miles = Math.max(1, Math.round(km / KM_PER_MILE));
  return miles === 1 ? copy.one : fill(copy.many, { miles });
}

export const milesToKm = (miles: number) => Math.round(miles * KM_PER_MILE);

/** "EXCELLENT" → "Excellent". */
const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase().replace(/_/g, " ");

export const trustText = (trust: TrustBadge | null | undefined) =>
  trust ? fill(getMemberCopy().trust, { value: trust.value.toFixed(1), label: titleCase(trust.label) }) : getMemberCopy().missing;

/** Option lists for enum labels ("NEVER" → "Never"); cached for an hour by the API module. */
export const optionLists = () =>
  onboardingApi
    .options()
    .then(({ data }) => toStepOptions(data).fields)
    .catch(() => null);

type Lists = Awaited<ReturnType<typeof optionLists>>;

function labelOf(list: SelectOption[] | undefined, value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return getMemberCopy().missing;
  return list?.find((option) => option.value === value)?.label ?? titleCase(value);
}

/** `GET /discovery/profile/:nickname` → the profile screens' member; null when unavailable. */
export function toMember(profile: DiscoveryProfile, lists: Lists, ownInterestIds: string[]): Member | null {
  if (profile.availability !== "ACTIVE") return null;
  const copy = getMemberCopy();
  const name = profile.nickname;
  const photos = [...profile.photos].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.position - b.position);
  const main = photos[0];
  const interests = profile.interests.map((interest: InterestTag) => interest.label);
  const shared = profile.interests.filter((interest) => ownInterestIds.includes(interest.id)).map((interest) => interest.label);
  const lookingFor = labelOf(lists?.goal, profile.lookingFor);
  const city = profile.location?.city;
  const value = (amount: number | null, template: string) => (amount ? fill(template, { value: amount }) : copy.missing);
  const kids = profile.hasKids === null ? copy.missing : profile.hasKids ? copy.kids.yes : copy.kids.no;
  const fact = (label: string, text: string): Fact => ({ label, value: text });
  const facts = {
    height: fact(copy.facts.height, value(profile.heightCm, copy.height)),
    weight: fact(copy.facts.weight, value(profile.weightKg, copy.weight)),
    smoking: fact(copy.facts.smoking, labelOf(lists?.smoking, profile.smoking)),
    alcohol: fact(copy.facts.alcohol, labelOf(lists?.alcohol, profile.drinking)),
    children: fact(copy.facts.children, kids),
    religion: fact(copy.facts.religion, labelOf(lists?.religion, profile.religion)),
    occupation: fact(copy.facts.occupation, profile.occupation || copy.missing),
    education: fact(copy.facts.education, labelOf(lists?.education, profile.educationLevel)),
    languages: fact(copy.facts.languages, profile.languages.length ? profile.languages.map((code) => labelOf(lists?.languages, code)).join(" · ") : copy.missing),
    lookingFor: fact(copy.facts.lookingFor, lookingFor),
    location: fact(copy.facts.location, [city, profile.location?.countryCode].filter(Boolean).join(", ") || copy.missing),
  };
  return {
    id: name,
    name,
    age: profile.age,
    photo: memberPhoto(name, main?.url),
    morePhotos: photos.slice(1).map((photo) => memberPhoto(name, photo.url, copy.morePhotoAlt)),
    location: city ? fill(copy.location.city, { city }) : copy.location.unknown,
    distance: distanceText(profile.distanceKm),
    verified: profile.isVerified,
    cardInterests: interests.slice(0, 3),
    trustLine: fill(copy.trustLine, { trust: trustText(profile.trustScore), lookingFor }),
    headline: profile.lookingFor ? lookingFor : fill(copy.headline, { name }),
    tagline: interests.slice(0, 3).join(". "),
    bio: profile.bio ?? "",
    overviewFacts: [facts.height, facts.occupation, facts.smoking, facts.alcohol, facts.children, facts.lookingFor],
    aboutFacts: Object.values(facts),
    profileInterests: interests,
    interestsSummary: interests.slice(0, 3).join(" · ") || copy.missing,
    compatibility: null,
    sharedInterests: shared,
    trustScore: profile.trustScore ? profile.trustScore.value.toFixed(1) : copy.missing,
  };
}
