import type { ReactNode } from "react";
import { accountScreens, type AccountScreen, type PortalView } from "@/lib/portal/views";
import { fill } from "@/lib/format";
import {
  getAccountPage,
  getMembershipPage,
  getChatPage,
  getCompatPage,
  getDatePage,
  getGamePage,
  getStories,
  getStoriesPage,
  getDiscoverPage,
  getFiltersPage,
  getInboxPage,
  getMatchDetailPage,
  getMatchesPage,
  getMemberName,
  getPortalShell,
  getProfilePage,
} from "@/stores/portal-store";
import { AccountView } from "@/components/sections/portal/settings/account-view";
import { LocationView } from "@/components/sections/portal/settings/location-view";
import { BlockedView } from "@/components/sections/portal/settings/blocked-view";
import { ChatView } from "@/components/sections/portal/chats/chat-view";
import { CheckoutView } from "@/components/sections/portal/membership/checkout-view";
import { MembershipView } from "@/components/sections/portal/membership/membership-view";
import { PlansView } from "@/components/sections/portal/membership/plans-view";
import { QuotaView } from "@/components/sections/portal/membership/quota-view";
import { RestoreView } from "@/components/sections/portal/membership/restore-view";
import { SubscriptionView } from "@/components/sections/portal/membership/subscription-view";
import { DeleteAccountView } from "@/components/sections/portal/settings/delete-account-view";
import { NotificationsView } from "@/components/sections/portal/settings/notifications-view";
import { NotifyPrefsView } from "@/components/sections/portal/settings/notify-prefs-view";
import { OwnProfileView } from "@/components/sections/portal/profile/own-profile-view";
import { PhotoManageView } from "@/components/sections/portal/profile/photo-manage-view";
import { PrivacyView } from "@/components/sections/portal/settings/privacy-view";
import { ProfileEditView } from "@/components/sections/portal/profile/profile-edit-view";
import { ReportView } from "@/components/sections/portal/settings/report-view";
import { SettingsView } from "@/components/sections/portal/settings/settings-view";
import { TrustHelpView } from "@/components/sections/portal/profile/trust-help-view";
import { TrustHistoryView } from "@/components/sections/portal/profile/trust-history-view";
import { TrustView } from "@/components/sections/portal/profile/trust-view";
import { DateStepView } from "@/components/sections/portal/dates/date-step-view";
import { GameView } from "@/components/sections/portal/games/game-view";
import { StoriesView } from "@/components/sections/portal/stories/stories-view";
import { StoryCreateView } from "@/components/sections/portal/stories/story-create-view";
import { StoryMineView } from "@/components/sections/portal/stories/story-mine-view";
import { StoryView } from "@/components/sections/portal/stories/story-view";
import { CompatView } from "@/components/sections/portal/discover/compat-view";
import { DiscoverView } from "@/components/sections/portal/discover/discover-view";
import { FiltersView } from "@/components/sections/portal/discover/filters-view";
import { InboxView } from "@/components/sections/portal/chats/inbox-view";
import { MatchDetailView } from "@/components/sections/portal/matches/match-detail-view";
import { MatchesView } from "@/components/sections/portal/matches/matches-view";
import { ProfileView } from "@/components/sections/portal/discover/profile-view";

/** W09 screens: tab title key and view. */
const accountViews = {
  PROFILE: { title: "profile", View: OwnProfileView },
  "PROFILE-EDIT": { title: "edit", View: ProfileEditView },
  "PHOTO-MANAGE": { title: "photos", View: PhotoManageView },
  TRUST: { title: "trust", View: TrustView },
  "TRUST-HISTORY": { title: "trustHistory", View: TrustHistoryView },
  "TRUST-HELP": { title: "trustHelp", View: TrustHelpView },
  SETTINGS: { title: "settings", View: SettingsView },
  ACCOUNT: { title: "account", View: AccountView },
  "SETTINGS-LOCATION": { title: "location", View: LocationView },
  "NOTIFY-PREFS": { title: "notifyPrefs", View: NotifyPrefsView },
  PRIVACY: { title: "privacy", View: PrivacyView },
  BLOCKED: { title: "blocked", View: BlockedView },
  "DELETE-ACCOUNT": { title: "delete", View: DeleteAccountView },
  NOTIFICATIONS: { title: "notifications", View: NotificationsView },
} satisfies Record<Exclude<AccountScreen, MembershipScreen>, { title: keyof ReturnType<typeof getAccountPage>["documentTitles"]; View: () => ReactNode }>;

type MembershipScreen = (typeof accountScreens.membership)[number];

/** W10 screens: tab title key and view. */
const membershipViews = {
  MEMBERSHIP: { title: "membership", View: MembershipView },
  PLANS: { title: "plans", View: PlansView },
  "PAY-RESTORE": { title: "restore", View: RestoreView },
  "PAY-CANCEL": { title: "manage", View: SubscriptionView },
  QUOTA: { title: "limit", View: QuotaView },
} satisfies Record<MembershipScreen, { title: keyof ReturnType<typeof getMembershipPage>["documentTitles"]; View: () => ReactNode }>;

const isMembershipScreen = (screen: AccountScreen): screen is MembershipScreen => screen in membershipViews;

/** Browser tab title of a portal view. */
export function portalViewTitle(view: PortalView) {
  switch (view.kind) {
    case "discover":
      return getDiscoverPage().title;
    case "filters":
      return getFiltersPage().title;
    case "profile":
      return fill(getProfilePage().documentTitle, { name: getMemberName(view.member) });
    case "compat":
      return getCompatPage().title;
    case "matches":
      return getMatchesPage().documentTitles[view.tab];
    case "match":
      return fill(getMatchDetailPage().documentTitle, { name: getMemberName(view.member) });
    case "inbox":
      return getInboxPage().title;
    case "chat":
      return fill(getChatPage().documentTitle, { name: getMemberName(view.member) });
    case "date":
      return fill(getDatePage().documentTitles[view.step], { name: getMemberName(view.member) });
    case "game":
      return fill(getGamePage().documentTitle, { name: getMemberName(view.member) });
    case "stories":
      return getStoriesPage().documentTitles.feed;
    case "story":
      return getStories().find((story) => story.id === view.id)?.detailTitle ?? getStoriesPage().documentTitles.feed;
    case "storyCreate":
      return getStoriesPage().documentTitles.create;
    case "storyMine":
      return getStoriesPage().documentTitles.mine;
    case "account":
      return isMembershipScreen(view.screen)
        ? getMembershipPage().documentTitles[membershipViews[view.screen].title]
        : getAccountPage().documentTitles[accountViews[view.screen].title];
    case "report":
      return getAccountPage().documentTitles.report;
    case "checkout":
      return getMembershipPage().documentTitles.checkout;
  }
}

/** Header nav label of the area a view belongs to (none for profile, settings and reports). */
export function portalViewArea(view: PortalView) {
  const [discover, matches, chats, stories] = getPortalShell().nav;
  if (view.kind === "account" || view.kind === "report" || view.kind === "checkout") return undefined;
  if (view.kind === "inbox" || view.kind === "chat" || view.kind === "game") return chats.label;
  if (view.kind === "stories" || view.kind === "story" || view.kind === "storyCreate" || view.kind === "storyMine") return stories.label;
  return view.kind === "matches" || view.kind === "match" || view.kind === "date" ? matches.label : discover.label;
}

/** W04 / Discovery & Matches — one portal view. */
export function PortalPage({ view }: { view: PortalView }) {
  switch (view.kind) {
    case "discover":
      return <DiscoverView />;
    case "filters":
      return <FiltersView />;
    case "profile":
      return <ProfileView memberId={view.member} />;
    case "compat":
      return <CompatView memberId={view.member} />;
    case "matches":
      return <MatchesView tab={view.tab} />;
    case "match":
      return <MatchDetailView memberId={view.member} />;
    case "inbox":
      return <InboxView />;
    case "chat":
      return <ChatView memberId={view.member} />;
    case "date":
      return <DateStepView step={view.step} memberId={view.member} />;
    case "game":
      return <GameView memberId={view.member} />;
    case "stories":
      return <StoriesView />;
    case "story":
      return <StoryView id={view.id} />;
    case "storyCreate":
      return <StoryCreateView />;
    case "storyMine":
      return <StoryMineView />;
    case "account": {
      const { View } = isMembershipScreen(view.screen) ? membershipViews[view.screen] : accountViews[view.screen];
      return <View />;
    }
    case "report":
      return <ReportView subject={view.subject} />;
    case "checkout":
      return <CheckoutView planId={view.plan} />;
  }
}
