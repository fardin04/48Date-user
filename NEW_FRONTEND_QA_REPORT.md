# 48Date web frontend: new frontend QA report

This report is the companion to `NEW_FRONTEND_IMPROVEMENT_ROADMAP.txt` and follows AGENTS.md rules 46–58. Every phase updates it. The older `FRONTEND_QA_REPORT.md` (11 Nov 2026) is kept as history and is not edited.

| | |
|---|---|
| Phase 0 date | 2026-11-16 |
| Branch | `master` (clean at the start of Phase 0) |
| Scope | Frontend only. Backend needs are listed in [section 8](#8-backend--api-blockers-and-recommendations). |

---

## 1. Project architecture

| Area | Detail |
|---|---|
| Framework | Next.js 16.4.3 (App Router, `cacheComponents` / partial prerendering, Turbopack), React 19.3.0 with the React Compiler, TypeScript 5 |
| Styling | Tailwind CSS v4. Tokens are in `src/app/globals.css` and registered in `lib/type-scale.ts`, `lib/control-sizes.ts` and `lib/tones.ts`. Text uses px sizes (rules 4 / 24); display type is fluid on `100vw` between 390 and 1920 px. |
| Data | TanStack Query v5 is the only client cache: `useLoaded(screenKeys…)`, `cached()` / `invalidate()`. SSE goes through `api.stream`; Socket.IO through `lib/api/socket.ts`. |
| Layers | component → feature service (`authService`, `onboardingService`, `portalService`, `chatService`, `dateService`, `gameService`, `storyService`, `accountService`, `membershipService`) → `apiEnabled ? api… : mock…` → `lib/api/modules/*` → `lib/api/client.ts` with `lib/api/endpoints.ts` |
| Content | `src/data/**` read through `src/stores/**`. Links use `hrefFor` / `to` / `toItem` (`src/lib/routes.ts`). |
| Pieces | `src/components/pieces/<kind>/` (~95 pieces) and `src/components/sections/<page>/` (portal split by feature) |
| Routing | Path-based optional catch-alls (`[[...view]]`, `[[...section]]`, `[[...step]]`, `onboarding/[step]`) that prerender sample members; flow states are client states on the step URL (rule 32) |
| Auth | 15-minute access token in memory; rotating refresh token in localStorage, refreshed under a browser-wide Web Lock; one session per account |
| Guards | `SessionGate` (members / guests) and `SetupGate` (unfinished setup) |
| Env | `NEXT_PUBLIC_API_BASE_URL` (`.env.local` points at `http://localhost:3000/api/v1`; run the frontend with `npm run dev -- -p 3001`) |

## 2. Route inventory (discovered)

Screen codes come from `src/lib/routes.ts`. Views come from `src/components/sections/portal/shared/portal-page.tsx`. Client states live on the same URL.

### Public and legal

| Route | Screen | States / notes | Phase |
|---|---|---|---|
| `/`, `/<section>` (e.g. `/how-it-works`) | L02 | landing sections; not-found segment | 2 |
| `/terms`, `/terms/<section>` | L02-TC | draft legal copy | 3 |
| `/privacy`, `/privacy/<section>` | L03 | draft legal copy | 3 |
| unknown top-level path | not-found | status 200 by design (PPR) | 35 |

### Authentication

| Route | Screen | States | Phase |
|---|---|---|---|
| `/signup` | WELCOME | PHONE-ERROR | 4 |
| `/signup/verify` | OTP | OTP-FILLED / ERROR / RESEND / EXPIRED / LIMIT, VERIFY-PROCESS, dev OTP hint | 4 |
| `/signup/verified` | PHONE-VERIFIED | setup routing | 4 |
| `/signup/google`, `/signup/google/error` | GOOGLE-REDIRECT, GOOGLE-ERROR | | 4 |
| `/signin` | SIGNIN | | 4 |
| `/signin/verify` | OTP-SIGNIN | as OTP | 4 |
| `/signin/verified` | SIGNIN-VERIFIED | | 4 |
| `/signin/google`, `/signin/google/error` | SIGNIN-GOOGLE, SIGNIN-GOOGLE-ERROR | | 4 |
| `/signin/session-ended` | SESSION | | 4 |

### Onboarding (guided setup)

Step order comes from `data/onboarding/flow.ts`.

| Route | Screen | States | Phase |
|---|---|---|---|
| `/onboarding/location` | LOCATION | LOC-MANUAL, LOC-NORESULT, LOC-DENIED | 5 |
| `/onboarding/nickname` | NICKNAME | NICK-CHECK, NICK-TAKEN, D-117 lock | 5 |
| `/onboarding/private-name` | PRIVATE-NAME | | 5 |
| `/onboarding/birthday` | BIRTHDAY | SELECT-OCCUPATION, AGE-GATE | 5 |
| `/onboarding/lifestyle`, `/identity`, `/personality`, `/communication`, `/interests`, `/details`, `/goals` | LIFESTYLE … GOALS | select dialogs, interest limit | 5 |
| `/onboarding/photos` | PHOTOS | PHOTO-SOURCE / PREVIEW / UPLOAD / ERROR / READY, live camera | 6 |
| `/onboarding/verify` | VERIFY-INTRO | VERIFY-CAMERA / DENIED / CAPTURE / REVIEW / PENDING / RETRY / DONE / STATUS | 6 |
| `/onboarding/notifications` | NOTIFY | NOTIFY-DENIED | 6 |
| `/onboarding/ready` | READY | starts auto-matching | 6 |

### Member portal

| Route | Screen | States / notes | Phase |
|---|---|---|---|
| `/discover` | DISCOVER | SWIPE-PASS / LIKE / SUPER, DISCOVER-NEXT, MATCH-NEW, DISCOVER-EMPTY, FILTERS-EMPTY | 7 |
| `/discover/filters` | FILTERS | | 8 |
| `/discover/profile/<member>` | DISCOVER-PROFILE | MEMBER-UNAVAILABLE | 9 |
| `/discover/compatibility/<member>` | COMPAT | COMPAT-PENDING | 9 |
| `/likes` (**new**) | LIKES | empty, locked mode, match confirmation | 10 |
| `/matches`, `/matches/cancelled`, `/matches/complete` | MATCHES, MATCHES-CANCELLED, MATCHES-COMPLETE | MATCHES-EMPTY, "Looking for matches…" | 11 |
| `/matches/match/<member>` | MATCH-EXPIRING | MATCH-EXPIRED, active, confirmed | 11 |
| `/chats` | INBOX | CHAT-EMPTY | 12 |
| `/chats/<member>` | CHAT-01 | CHAT-TYPED / SENT / FAILED / AI / ATTACH / PHOTO / VOICE, AI-STARTERS / GENERATING / ERROR, MSG-01, CHAT-INVITE, CHAT-DATE, BLOCK dialog, BLOCK-DONE | 12–14 |
| `/dates/venues/<member>` | VENUES | VENUES-EMPTY (+ new VENUES-AREA) | 15 |
| `/dates/place/<member>` | VENUE-DETAIL | | 15 |
| `/dates/time/<member>` | DATE-TIME | DATE-PICKER, TIME-PICKER | 16 |
| `/dates/review/<member>` | DATE-REVIEW | weather hint | 16 |
| `/dates/plan/<member>` | DATE-PENDING | received, confirmed, declined, cancelled, invite expired, postpone; after the date: ATTENDANCE, NO-SHOW, ATTENDANCE-WAIT, ATTENDANCE-REVIEW | 17–18 |
| `/dates/manage/<member>` | DATE-MANAGE | DATE-CANCEL, SELECT-CANCEL | 17 |
| `/dates/feedback/<member>` | FEEDBACK | FEEDBACK-DONE | 18 |
| `/dates/complete/<member>` | DATE-COMPLETE | | 18 |
| `/games/<member>` | GAMES | GAME-QUESTION / WAIT / RESULT / LEFT, GAME-LEAVE | 19 |
| `/stories` | STORIES | | 20 |
| `/stories/story/<id>` | STORY-DETAIL | COMMENT-SENT, partner consent | 21, 23 |
| `/stories/new` | STORY-CREATE | STORY-ERROR, STORY-PENDING | 22 |
| `/stories/mine` | STORY-MINE | STORY-DELETE, STORY-REJECT | 22, 23 |
| `/notifications` | NOTIFICATIONS | | 24 |
| `/profile` | PROFILE | PROFILE-UNVERIFIED | 25 |
| `/profile/trust`, `/profile/trust/activity`, `/profile/trust/review` | TRUST, TRUST-HISTORY, TRUST-HELP | | 25 |
| `/profile/edit`, `/profile/photos` | PROFILE-EDIT, PHOTO-MANAGE | PROFILE-SAVED | 26 |
| `/settings`, `/settings/account` | SETTINGS, ACCOUNT | SIGNOUT dialog, sign-in methods | 27 |
| `/settings/location` | SETTINGS-LOCATION | | 28 |
| `/settings/notifications` | NOTIFY-PREFS | PREFS-SAVED, NOTIFY-DENIED | 29 |
| `/settings/privacy`, `/report`, `/report/<member>`, `/report/<story>` | PRIVACY, REPORT-DETAIL | SELECT-REPORT, REPORT-DONE | 30 |
| `/settings/blocked` | BLOCKED | BLOCKED-EMPTY, UNBLOCK | 31 |
| `/settings/delete` | DELETE-ACCOUNT | DELETE-DONE | 32 |
| `/membership`, `/membership/plans` | MEMBERSHIP, PLANS | -FREE / -WEEKLY / -YEARLY | 33 |
| `/membership/checkout/<plan>` | PAY-REVIEW | PAY-PROVIDER / PROCESS / DONE / ERROR | 34 |
| `/membership/restore`, `/membership/manage`, `/membership/limit` | PAY-RESTORE, PAY-CANCEL, QUOTA | PAY-RESTORE-NONE, PAY-CANCELLED | 34 |
| any portal view | OFFLINE, GLOBAL-ERROR, warning dialog | `PortalGuard`, `warning-notice` | 35 |

Inaccessible or limited routes:
- Onboarding steps redirect finished members to MATCHES. All six test accounts are finished, so the onboarding walk-throughs run on the mock (phases 5 and 6).
- Attendance and story phases need a date whose time has passed, or a completed date. Dates can be created only 1 h–14 d ahead (phases 18, 22 and 23).

## 3. Test framework and baseline

| Check | Command | Result on 2026-11-16 |
|---|---|---|
| Unit + contract tests | `npm test` (Vitest 3.2.7, node environment, `src/**/*.test.ts`) | **3 files, 54 tests: 54 passed, 0 failed** (10.2 s) |
| ↳ | `src/lib/api/api-layer.test.ts` | 12 passed |
| ↳ | `src/lib/portal/portal-logic.test.ts` | 10 passed |
| ↳ | `src/test/api-contract.test.ts` (Postman replay) | 32 passed |
| Lint | `npm run lint` | clean (exit 0, no warnings) |
| Build | `npm run build` | compiled successfully, all routes prerendered, no warnings |

Notes:
- Vitest prints a Node "localStorage is not available" ExperimentalWarning. It comes from Node, not from a test, and is pre-existing.
- No browser was driven in Phase 0. The zoom matrix starts in Phase 1.

## 4. Testing gaps and the decision needed

- There is **no DOM or browser runner** (Vitest only, `environment: "node"`, no jsdom, Testing Library or Playwright). Browser-zoom, layout and component-interaction tests can't be automated as things stand.
- **Default (Option A):** each phase runs the 13-level zoom matrix with a browser tool and records it here, while Vitest covers the logic (pure helpers extracted for back navigation, ratios, menus, state mapping) and the contracts.
- **Option B (needs approval):** add `@playwright/test` as a single devDependency for automated zoom and viewport specs (viewport = window ÷ zoom, `deviceScaleFactor` = zoom). The roadmap prompts already say "only if Playwright has been approved and installed".

## 5. Known responsive and zoom issues

Browser zoom changes the CSS viewport. At a 1440×900 window: 50 % → 2880×1800, 110 % → 1309, 125 % → 1152, 150 % → 960, 175 % → 823, 200 % → 720×450, 300 % → 480×300, 400 % → 360×225.

| # | Issue | Where | Phase |
|---|---|---|---|
| R1 | The main column is capped at `max-w-480` (1920 px) while the header is full width, so ≈480 px grey bands appear on each side at 50 % zoom | `pieces/shells/portal-shell.tsx` | 1 |
| R2 | The "Flow support" aside is hidden from 768 to 1279 (110–175 % zoom); on STORIES it holds the "Have a story to tell?" / My shared story entry, so the primary action is unreachable | `sections/portal/shared/workspace.tsx`, `stories/story-context.tsx` | 1, 20 |
| R3 | Fixed-px xl grids: chat `280px / 1fr / 312px`, discover `240px / 448px / 1fr`, own profile `439px / 1fr`, `minmax(560px,…)` in the landing hero / nav | `chat-view.tsx`, `discover-view.tsx`, `own-profile-view.tsx`, `hero.tsx` / `site-nav.tsx` | 2, 7, 12, 25 |
| R4 | Fixed `ActionButton` widths (up to 300 px: setupPrimary 240, profileAction 300, summaryAction 240, notifyAction 224 …) are risky at 360 px | `lib/control-sizes.ts` | 1 |
| R5 | Chat panes are 760 px tall with a 420 px floor, taller than a 225–450 px viewport (200–400 %), so the composer can leave the screen | `chat-view.tsx` | 12 |
| R6 | The fixed phone tab bar takes a large share of a 225–300 px tall viewport | `portal-tab-bar.tsx` | 1 |
| R7 | Dialogs may exceed short viewports (no verified `max-h` with a scrolling body) | `overlays/portal-dialog.tsx`, `ui/dialog.tsx` | 1 |
| R8 | `HeaderMenu` is a fixed `w-24` box, with no room for the new heart control | `pieces/shells/header-menu.tsx` | 1, 10 |
| R9 | Fluid display type resolves to its minimum (140 / 64 / 46 px) at 360–480 px, so landing headlines may overflow | `globals.css` `type-fluid` | 2 |
| R10 | The swipe card plus decision buttons may not fit a 225–360 px tall viewport, which hides Like / Pass | `discover-view.tsx`, `swipe-card.tsx` | 7 |
| R11 | **Owner report (2026-11-16):** at 100 % the messaging section looks oversized, and the message box shows only one or two messages before scrolling | `chat-view.tsx`, `chat-bubble.tsx` | 12 (added to its audit, step D5 and acceptance) |
| R12 | **Owner report (2026-11-16):** after sending, a second "Sending…" copy shows beside the sent message for about a second. Cause: `chat-view.tsx` `send()` keeps its separate `pending` bubble until `await refresh()` returns, while the service (and the socket's `message:new`) have already rendered the real message. | `chat-view.tsx` (`pending`), `api-chat-service.ts` | 13 (added as step D6, with a test and an acceptance line) |
| R13 | **Owner report (2026-11-17):** at 100 % Discover shows only the photo and the name on the first screen; Pass / Like / Super Like need a scroll, and the type looks larger than in Figma. New standing rule 60 (first look fits the screen at 1440×900 / 1280×800 / 1366×768 / 1920×1080, Figma type sizes, polished at first sight) is now an acceptance line in every phase | `discover-view.tsx`, `swipe-card.tsx`; all pages | 7 (+ every phase) |

## 6. Known navigation (Back) issues

The only portal `router.back()` is in `discover-view.tsx` (empty states). Every other Back is a fixed data target.

| # | Back today | Should be | Where | Phase |
|---|---|---|---|---|
| B1 | INBOX → DISCOVER | history, fallback DISCOVER | `data/portal/chats.ts:34` | 12 |
| B2 | Shared shell Back → DISCOVER (used by matches-view, filters-view, compat-view, chat-photo, chat-voice) | history, with per-page fallbacks | `data/portal/shell.ts:19` | 1, 8, 9, 11, 13 |
| B3 | Games → INBOX | the conversation | `data/portal/games.ts:83` | 19 |
| B4 | Notifications → DISCOVER | history, fallback DISCOVER | `data/portal/account.ts:442` | 24 |
| B5 | Membership → PROFILE | history (Settings / Profile / Quota) | `data/portal/membership.ts:143` | 33 |
| B6 | Date plan states → the conversation, always | history (Notifications / Match detail), fallback the conversation | `dates/plan-view.tsx` (`PlanStatus`) | 17 |
| B7 | Profile sub-pages and settings sub-pages use fixed parents (mostly correct), but entries from elsewhere (e.g. Photos from PROFILE) return to the wrong parent | history first | `data/portal/account.ts` | 25–31 |
| B8 | Date "Change area" opens onboarding LOCATION (wrong flow; it can change the profile location) | date-specific area dialog | `data/portal/dates.ts:124`, `:129` | 15 |

The target behaviour is the roadmap's **Global back-navigation matrix**.

## 7. Known image issues

| # | Issue | Where | Phase |
|---|---|---|---|
| I1 | Story photo is a fixed `h-87.5` (350 px) / `h-60` box with `object-cover`, which crops 9:16, 16:9 and other uploads | `stories/story-body.tsx` | 21 |
| I2 | Story feed thumbnails use `object-cover` | `stories/stories-view.tsx` | 20 |
| I3 | Chat photo attachments are forced to `aspect-[4/5]` `object-cover` | `pieces/cards/chat-bubble.tsx` | 13 |
| I4 | One profile photo uses `object-cover object-bottom`, so faces can be cropped | `discover/profile-view.tsx` | 9 |
| I5 | Match / outcome cards use a fixed 240 px photo height instead of a ratio | `match-card.tsx`, `outcome-card.tsx` | 11 |
| I6 | The story create preview is `object-cover` | `stories/story-create-view.tsx` | 22 |
| I7 | The API returns no image width / height for stories, so the ratio must be measured on load (layout shift) | API | 1 (MediaFrame), 20 |

Image inventory: about 40 `next/image` usages. Portraits, avatars, venues and maps mostly use `object-cover`; `conversation-context`, `game-view` and `profile-context` use `object-contain`.

## 8. Backend / API blockers and recommendations

| # | Need | Current API | Frontend handling | Phase |
|---|---|---|---|---|
| X1 | **Unmatch** | No endpoint in `48Date-Backend.postman_collection.json` | Menu item shown as `notFunctional` with its reason. Proposed: `POST /matches/:matchId/unmatch` (or `DELETE /matches/:matchId`), which ends the match, closes the conversation, emits a socket event to both sides and returns `{ matchId, endedAt }` | 14 |
| X2 | **Date-specific venue search** | `POST /matches/:id/venue-suggestions` accepts only `category`; the midpoint is computed on the server | Client-side ranking by distance from the chosen area. Proposed: accept `{ latitude, longitude, radiusKm }` or `{ areaLabel }` | 15 |
| X3 | Story image dimensions | No `imageWidth` / `imageHeight` | Measured on load. Proposed: return them and accept them on create / update | 20–22 |
| X4 | Story-consent notification target | Omits `params.storyId` (known) | Opens STORIES. Proposed: send `params.storyId`, and document a partner-role query on `/users/me/success-stories` | 23 |
| X5 | Web push | `PUT/DELETE /users/me/push-token` accept only IOS / ANDROID | No web push. Proposed: a WEB platform with a VAPID subscription | 29 |
| X6 | `hideOnlineStatus` | Not returned by `/users/me` | Not built | 30 |
| X7 | ACCOUNT private details, TRUST-HELP | No endpoints | Stay on the mock | 25, 27 |
| X8 | Past and completed dates for testing | Dates must be 1 h–14 d ahead | Needs seeded past dates for attendance, feedback and story tests | 18, 22, 23 |
| X9 | Demo photos on `cdn.48date.app` don't resolve (known) | Seed data | Placeholder image | all |
| X10 | **Match card last message** | `GET /matches` returns `lastMessagePreview: null` on every match (seen live for tahmid_hasan, 10 matches whose conversations have messages) | Cards read the preview from `GET /conversations` (one cached request). Needed: fill `lastMessagePreview` (and `lastActivityAt`) from the conversation | 11 |
| X11 | Open matches with a running clock for testing | All seed matches have stopped clocks (completed dates); `meta.activeCount` 0 | Countdown parity across two accounts can't be checked until a new match is made (A5 of the test prompt) | 11 |
| X12 | Profile city for seed accounts | `useMemberLocation` gets no city for tahmid_hasan, so the Discover preferences card shows an empty "Location" row | Shown empty. Needed: seed `city` (or the area label) on the profiles | 7, 11 |
| X13 | **Session lost when a refresh response never arrives** | `POST /auth/refresh` rotates the refresh token, and a second use of the old one revokes every session of the account (`REFRESH_TOKEN_REUSED`). The web app keeps the access token only in memory (rule 41), so every page load, reload and new tab spends one refresh. If the page is reloaded or closed while that request is in flight, or the browser is force-closed before it saves localStorage, the server has rotated but the browser still holds the old token; the next visit is signed out ("signed out on another device"). Reproduced 2026-11-18 by force-closing headless Chrome right after a page load (3 times); a normal close never lost the session | Frontend can't close this: the new token is lost with the response. Needed: accept the previous refresh token for a short grace window (e.g. 30 s) and return the same new pair, instead of revoking the session. Optional frontend mitigation, needs owner approval because it changes rule 41: keep the 15-minute access token in sessionStorage so a reload doesn't refresh | all |

## 9. API dependencies (from the Postman User folder vs `src/lib/api/endpoints.ts`)

- **Wired:** auth (OTP, Google, refresh, logout, linking), onboarding (state, options, nickname, steps, files, verification + SSE), users (me, profile, photos, location, trust score, notification settings, warnings, own stories, eligible dates), discovery (preferences, runs + SSE, cards, profile, swipes), matching runs + SSE, matches (list, unseen, detail, seen, venue suggestions, dates), conversations (list, detail, messages, seen, games, AI suggestions + SSE), games, venues (run, events, weather), dates (list, detail, accept / decline / withdraw / postpone / cancel / confirm / rating), trust (report reasons, reports, blocks), notifications (list, unread, read, read-all), subscriptions (plans, me, entitlements, start, cancel), success stories (feed, detail, respond, like, comments), Socket.IO gateway.
- **In the collection but not used by the frontend:**

| Endpoint | Used by | Status |
|---|---|---|
| `GET /discovery/likes-received`, `POST …/:nick/match`, `POST …/:nick/pass` | Phase 10 | required |
| `POST /discovery/boost`, `GET /discovery/boost` | Phase 36 | optional |
| `POST /discovery/deck/undo` | Phase 36 | optional |
| `GET /discovery/feed`, `POST /discovery/feed/refresh` | Phase 36 | evaluate |
| `GET /matching/me` | Phase 11 / 36 | optional |
| `GET /dates/:id/history` | Phase 36 | optional |
| `GET` / `PATCH /dates/:id/rating` (read / change a sent rating) | Phase 36 | optional |
| `GET /ai/suggestions/quota` | Phase 13 / 36 | optional |
| `DELETE /notifications/:id` | Phase 24 / 36 | optional |
| `PATCH` / `DELETE /conversations/:id/messages/:messageId` | Phase 36 | optional |
| `DELETE /success-stories/:id/comments/:commentId` | Phase 21 | own comments |
| push token | Phase 29 | blocked (X5) |

## 10. Planned phase sequence and status

| Phase | Name | Priority | Status |
|---|---|---|---|
| 0 | Project audit and baseline | P0 | **Done 2026-11-16** |
| 1 | Global portal shell, layout, back-navigation and image infrastructure | P0 | **Done 2026-11-16** (see Phase 1 section) |
| 2 | Landing page (+ portal-wide zoom fill and focus, rule 59) | P2 | **Done 2026-11-16** (see Phase 2 section) |
| 3 | Legal pages | P3 | **Done 2026-11-16** (see Phase 3 section) |
| 4 | Authentication | P1 | **Done 2026-11-17** (see Phase 4 section; Phase 3 re-checked the same day) |
| 5 | Onboarding A (steps 1–11) | P2 | **Done 2026-11-17** (see Phase 5 section) |
| 6 | Onboarding B (photos, verification, notifications, ready) | P2 | **Done 2026-11-18** (see Phase 6 section; M1 API re-check handed to the browser tester) |
| 7 | Discover deck and match moment | P1 | **Done 2026-11-18** (see Phase 7 section; real-browser zoom and live multi-account checks not run, see the section) |
| 8 | Discovery filters | P2 | **Done 2026-11-18** (see Phase 8 section; real-browser zoom and live multi-account checks not run, see the section) |
| 9 | Member profile and compatibility | P2 | **Done 2026-11-18** (see Phase 9 section; real-browser zoom and live multi-account checks not run, see the section) |
| 10 | Likes Received (new) | P1 | **Done 2026-11-18** (see Phase 10 section; real-browser zoom and live multi-account checks not run, see the section) |
| 11 | Matches, outcomes and match details | P1 | **Done 2026-11-18** (see Phase 11 section; real-browser zoom and the countdown-parity check handed to the browser tester, `PHASE11_12_TEST_PROMPT.md`) |
| 12 | Messaging A: inbox and three-panel layout | P1 | **Done 2026-11-18** (see Phase 12 section; real-browser zoom and the two-account live-row check handed to the browser tester) |
| 13 | Messaging B: conversation, bubbles, composer, "+" menu | P1 | **Done 2026-11-18** (code verified; browser-tested by the owner's tester, see Phase 13 section) |
| 14 | Messaging C: conversation menu (unmatch, block, report) | P1 | **Done 2026-11-18** (code verified; browser-tested by the owner's tester; Unmatch blocked on N12) |
| 15 | Date venues, place details, date-specific area | P1 | **Done 2026-11-18** (code + unit tests; browser-tested by the owner's tester, results not written into this report) |
| 16 | Date time, review, invitation | P1 | **Done 2026-11-18** (code + unit tests; browser checks with the tester) |
| 17 | Date plan states and manage | P1 | **Done 2026-11-18** (code + unit tests; live two-account checks with the tester) |
| 18 | Accepted date details, attendance, feedback, completion | P1 | **Done 2026-11-18** (code + unit tests; past-date check with the tester) |
| 19 | Games | P2 | **Done 2026-11-18** (code + unit tests; browser checks in `PHASE19_21_TEST_PROMPT.md`) |
| 20 | Stories feed | P1 | **Done 2026-11-18** (code + unit / contract tests; browser checks with the tester) |
| 21 | Story details, comments, likes | P2 | **Done 2026-11-18** (code + unit / contract tests; browser checks with the tester) |
| 22 | Story creation and My story | P2 | Not started |
| 23 | Story partner consent | P2 | Not started |
| 24 | Notifications | P1 | Not started |
| 25 | Own profile and trust | P2 | Not started |
| 26 | Edit profile and photos | P2 | Not started |
| 27 | Settings hub, account, sign out | P2 | Not started |
| 28 | Location settings | P3 | Not started |
| 29 | Notification settings | P3 | Not started |
| 30 | Privacy and report | P2 | Not started |
| 31 | Blocked users | P3 | Not started |
| 32 | Account deletion | P3 | Not started |
| 33 | Membership and plans | P2 | Not started |
| 34 | Checkout, restore, manage, quota | P2 | Not started |
| 35 | Global states (guards, offline, error, not found, warnings) | P2 | Not started |
| 36 | Extra API-driven features (owner approval) | P3 | Not started |
| 37 | Final regression and multi-account end-to-end | P1 | Not started |

## 11. Phase 0 record

| Item | Detail |
|---|---|
| Status | Done |
| Files changed | `AGENTS.md` (new section "Frontend Responsiveness, Image, Navigation and QA Standards", rules 46–58, after rule 45; existing content unchanged), `CLAUDE.md` (pointer section with the same name), `NEW_FRONTEND_IMPROVEMENT_ROADMAP.txt` (new), `NEW_FRONTEND_QA_REPORT.md` (new) |
| Code changes | None |
| Tests executed | `npm test` 54/54 passed; `npm run lint` clean; `npm run build` clean |
| Bugs found | Sections 5–8 |
| Bugs fixed | None (Phase 0 records only) |
| Backend / API blockers | Section 8 |
| Remaining issues | All of the above, assigned to phases |

## Phase 1: Global portal shell, shared layout, back-navigation and image infrastructure

### Pre-change audit (2026-11-16)

Method: headless Chrome 157 driven over the DevTools protocol from a scratch script (no project dependency). Each zoom is emulated as its CSS viewport (window ÷ zoom, `deviceScaleFactor` = zoom), as rule 46 allows when no real-zoom browser tool is available. This session had no Chrome / built-in browser MCP tool. The account was M2 (Rohan Sen, FREE), signed in through the UI test-OTP hint in its own Chrome profile, against the staging API in `.env.local`.

| Route | Overflow-x (13 levels) | Left / right bands | Tab bar | Console errors |
|---|---|---|---|---|
| `/discover` | none | **480 px each side at 50 %** (main capped at 1920 px; header full width) | 65 px of a 225 px viewport at 400 % (29 %) | 0 |
| `/chats` | none | 480 px each side at 50 % | 65 px of 225 at 400 % | 0 |
| `/settings` | none | 480 px each side at 50 % | 65 px of 225 at 400 % | 0 |
| `/matches` | none | 473 px each side at 50 % | 65 px of 225 at 400 % | 0 |

Code findings:
- `HeaderMenu` is a fixed `w-24` box (no room for a third control).
- Fixed `ActionButton` widths up to 300 px (`profileAction`) don't shrink inside a 345 px viewport, and labels are `whitespace-nowrap`.
- The `PortalDialog` 128 px tall header plus 32 px padding fills most of a 225 px viewport.
- The shared `PortalBack` always goes to its data target.
- 8 `router.replace` calls (6 in portal sections, 2 in the gates) are invisible to any history tracking.

### Result

| | |
|---|---|
| Status | **Done** (2026-11-16) |
| Routes completed | Shell level for every PortalShell route (`/discover`, `/matches`, `/chats`, `/dates`, `/games`, `/stories`, `/profile`, `/settings`, `/notifications`, `/report`, `/membership`). Page-level layouts stay with their own phases. |
| Tests | `npm test`: **6 files, 107 tests, 107 passed, 0 failed** (the 54 existing tests unchanged, plus 53 new) · `npm run lint`: clean · `npm run build`: compiled, no warnings (also built once in mock mode for the browser checks) |

**Files changed**
- New:
  - `src/lib/navigation/nav-trail.ts`, `src/lib/navigation/replace-route.ts`
  - `src/hooks/use-back-target.ts`
  - `src/components/pieces/layout/navigation-tracker.tsx`
  - `src/lib/media/aspect.ts`, `src/components/pieces/media/media-frame.tsx`
- New tests:
  - `src/lib/navigation/nav-trail.test.ts` (13)
  - `src/lib/navigation/back-fallbacks.test.ts` (28)
  - `src/lib/media/aspect.test.ts` (12)
- Changed:
  - `src/app/layout.tsx` (tracker inside `Suspense`), `src/app/globals.css` (`short` variant, `break-anywhere`)
  - `src/components/pieces/actions/portal-back.tsx` (history-aware, client)
  - `src/components/pieces/shells/portal-shell.tsx`, `header-menu.tsx`, `portal-tab-bar.tsx`, `session-gate.tsx`, `setup-gate.tsx`
  - `src/components/pieces/overlays/portal-dialog.tsx`, `src/components/sections/portal/shared/workspace.tsx`
  - `src/lib/control-sizes.ts` (shrinkable widths, `mediaHeights`), `src/lib/tones.ts` (`media` surface), `src/data/types.ts` (`Action.back`)
  - `replaceRoute` in `dates/manage-view.tsx`, `dates/plan-view.tsx`, `dates/review-view.tsx`, `membership/subscription-view.tsx`, `settings/settings-view.tsx`, `stories/story-mine-view.tsx`
  - `AGENTS.md` (Pieces registry, one Decisions entry)

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P1-1 | 480 px grey bands beside the content at 50 % zoom (main capped at 1920 px, header full width) | Main is full width like the header (Figma gutters kept) |
| P1-2 | The phone tab bar took 65 px (29 %) of a 225 px viewport at 400 % | Icon-only, 44 px tall bar under the `short` variant (labels kept for screen readers); main bottom padding follows |
| P1-3 | `PortalDialog` header (128 px) plus padding nearly filled short viewports | `short`: no tall header, 16 px padding, actions pinned to the bottom of the scrolling panel. All actions visible at 360×225. |
| P1-4 | Fixed button widths (up to 300 px, labels nowrap) couldn't shrink | Fixed widths are `max-w-full`, wrapping only when narrower than Figma |
| P1-5 | `HeaderMenu` fixed `w-24` left no room for a third control | Intrinsic width; logo-to-menu gap at 345 px is 139 px, room for a 44 px control |
| P1-6 | Every portal Back went to a fixed screen, regardless of where the member came from | History-first `PortalBack` with the data `to` as fallback; per-tab trail; `replaceRoute` for all 8 portal / gate replaces |
| P1-7 | Workspace grid children could be widened by their content | `min-w-0` on the panel and the aside; `tabletAside` option ("below") for pages whose aside holds a unique action |

**Zoom matrix (after)**

Method: headless Chrome over CDP at a 1440×900 window, each zoom emulated as its CSS viewport with `deviceScaleFactor` = zoom. Mock-mode production build (see blockers), signed in through the mock. Spot checks at a 1920×1080 window for 50 / 200 / 400 %.

| Route | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/discover` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Main 0–2880 px at 50 % (was 480–2400). Tab bar 45 / 225 px at 400 % (was 65). The page's own fixed 240 / 448 columns are Phase 7. |
| `/chats` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Composer / pane heights are Phase 12 |
| `/settings` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | SIGNOUT dialog at 400 %: panel 16–209 px of 225, "Log out" and "Stay signed in" both visible |
| `/matches` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | |
| 1920×1080: all four routes | ✓ (3840 px) | | | | | | | | ✓ | | | | ✓ (480×270, tab 45 px) | |

✓ means: no horizontal overflow (`scrollWidth = clientWidth`), no element outside the viewport, header / main / tab bar edges at 0 and the viewport width, and no console errors.

**Back-navigation checks**

| Check | Result |
|---|---|
| (a) `/settings` → `/settings/privacy` → Back = `/settings` | PASS (real API and mock) |
| (b) `/matches` → `/matches/match/goldenhour` → Back = `/matches` | PASS. The active conversation has no Back control yet; it is added in Phase 12. |
| Direct entry to `/settings/privacy` → Back = SETTINGS fallback | PASS |
| Refresh on `/settings/privacy` keeps the trail | PASS (real API and mock) |
| Sign-out clears the trail | By design: `authService.signOut` clears every `48date.*` sessionStorage key, and a rejected session runs `onCacheClear`. Unit-tested via `clear()`; not run in the browser, to avoid signing out the test accounts. |

**Images:** the header avatar (40 px, 1:1 cover) is unstretched at every zoom (screenshots). `MediaFrame` is built and unit-tested for 16:9, 9:16, 4:3, 3:4, 1:1, 21:9 and 1:3; feature images adopt it in phases 13 and 20–22.

**Functional checks**
- Unread dot and avatar still load only once a session exists (unchanged code path).
- `SessionGate` redirects signed-out visitors to `/signin`; observed whenever the staging session was revoked.
- Header fits at 400 %; tab-bar labels show on a 390×844 phone.

**Backend / API blockers and environment notes**
- **Shared test accounts lose their session.** The staging backend keeps one session per account and revokes it on refresh-token reuse. During this phase the M2 session was revoked repeatedly while idle; no sign-out was performed. That fits someone else signing into M2 against the same staging API.
  - Two revocations came from my own test harness, which closed Chrome before the rotated refresh token reached disk; that harness is now fixed.
  - Because of this, the 13-level matrix and the dialog / header checks were run on a mock-mode production build. The layout and routing code is the same.
  - Recommendation: give each tester or automation run its own account, as AGENTS.md "Sessions" already advises.
- **Port 3000** is this repo's own `next dev` (the API is the remote staging host in `.env.local`). The AGENTS.md note "the backend owns port 3000" doesn't match this machine. Not changed; for the owner to confirm.

**Remaining issues (out of Phase 1 scope)**
- `router.replace` in auth (`verify-step`, `google-step`) and onboarding (`onboarding-resume`) still bypass `replaceRoute`. Harmless for Back, which never returns to auth or setup pages; for phases 4–6.
- The active conversation has no Back control (Phase 12).
- `/discover` keeps fixed 240 / 448 px columns at ≥1280 (Phase 7).
- The 88 px header isn't compacted in short viewports. It scrolls away, so it doesn't block content; revisit if a page needs its primary action above the fold at 400 %.
- No page sets `tabletAside="below"` yet (Stories, Phase 20).

## Phase 2: Landing page and public sections (+ zoom fill and focus across the portal)

The owner added three requirements for this phase, and they apply to every later phase (AGENTS.md rule 59, and a new standing rule in every roadmap phase prompt):
1. No empty space anywhere on a page, including below it.
2. When zooming **in**, the page's main thing leads: the composer in a conversation, the profile photo and details plus Like / Pass on Discover.
3. When zooming **out**, the whole page scales evenly, instead of one component growing and leaving gaps.

### Pre-change audit (2026-11-16)

Method: headless Chrome 157 over CDP from a scratch script (no project dependency). Each zoom level is emulated as its CSS viewport with `deviceScaleFactor` = zoom (rule 46); this session had no real-zoom browser tool. The landing page was tested against the owner's own `next dev` on port 3000. It is static: **0 API requests**.

| Check | Result before |
|---|---|
| Horizontal overflow, 13 zooms + 1920 spot checks + rule 3 widths (23 runs) | none (`scrollWidth = clientWidth` everywhere) |
| Headline at 360–480 px | fits: h1 16–344 px at 360, no clipping |
| 1920 composition | page height 9651 px (Figma 9652) |
| Hero collage at 1280 (110 % zoom) | **bug**: the quote card's 300 px minimum pushed it 42 px past the content column into the gutter |
| Match window at 1024–1279 (125 % zoom) | **bug**: the heading was squeezed into a ~210 px column beside the countdown ("A little / time.") |
| Glass nav in short viewports | `absolute`, scrolls away (never covers content). But at 300–400 % the 84 px bar plus 144 px of hero padding filled the first screen, so the headline started below the fold. |
| 50 % zoom | section backgrounds are full-bleed, but the 1536 column left 672 px empty on each side at 2880 px |
| Portal bottom (owner report) | short pages left a grey band under the workspace; the chat panes stopped at 760 px, leaving a band at 50–75 % |
| Portal at 200–400 % | conversation composer at y = 663 in a 225 px viewport (off-screen); on Discover the preferences column came before the card, so Like / Pass sat at y = 523 |
| Portal at 50–75 % | Discover's 240 / 448 px columns stayed fixed while the overview grew, so the page looked uneven |
| Console | one Next LCP warning, caused by the harness's programmatic scrolling (later lazy images became LCP candidates). It was not seen on a plain load. |

### Result

| | |
|---|---|
| Status | **Done** (2026-11-16) |
| Routes completed | `/` and every section path (`/how-it-works`, `/features`, `/safety`, `/membership`, `/download`, `/faq`); zoom fill and focus for every PortalShell route (shared shell, `Workspace`, chat, discover) |
| Tests | `npm test`: **10 files, 158 tests, 158 passed, 0 failed** (the 107 earlier tests unchanged, plus 51 new) · `npm run lint`: clean · `npm run build`: compiled, no warnings |

**Files changed**
- Landing: `sections/landing/hero.tsx`, `sections/landing/match-window.tsx`, `sections/landing/landing-page.tsx`, `pieces/shells/site-nav.tsx` (glass variant only; legal pages use `solid`)
- Zoom fill (shared): `src/app/globals.css` (zoom-out fit, `--svh`), `pieces/shells/portal-shell.tsx`, `sections/portal/shared/workspace.tsx`, `ui/dialog.tsx` (max height via `--svh`), `lib/control-sizes.ts` (`layout.stickyActions`, `mediaHeights` via `--svh`)
- Zoom focus: `src/hooks/use-primary-in-view.ts` (new), `sections/portal/chats/chat-view.tsx`, `sections/portal/chats/conversation-list.tsx`, `sections/portal/discover/discover-view.tsx`
- Docs: `AGENTS.md` (rule 59, hooks list, `Workspace` registry entry, two Decisions entries), `CLAUDE.md` (rule 59 pointer), `NEW_FRONTEND_IMPROVEMENT_ROADMAP.txt` (completion tags, plus the new standing zoom rule in all 38 phase prompts)

**New tests**
- `src/lib/routes.landing.test.ts` (5): each anchor builds `/<id>` with no hash; the ids are URL-safe and unique; `sectionFromParam` accepts the root and each anchor and rejects unknown, nested, not-found and wrongly cased values; every nav section link targets a real anchor.
- `src/data/landing/landing-images.test.ts` (31): every image reachable from the landing store has an explicit `alt` (empty marks decorative), positive width / height, and a file in `public/`.
- `src/hooks/use-primary-in-view.test.ts` (4): stacked layouts (≤1023 px) lead with the primary region when its control starts below the viewport. Visible controls and multi-column layouts never move, including 1440×900, where Like / Pass end 10 px below the fold.
- `src/app/zoom-fit.test.ts` (11): every zoom-out step in `globals.css` equals viewport ÷ design frame (portal 1440, landing 1920); 50 % and 75 % lay out at the design frame; heights inside use `--svh`.

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P2-1 | Hero quote card overflowed the content column at 1280–1309 | Anchored from the right (`right-[4.81%]`, the same Figma geometry), so the 300 px minimum grows leftwards. Grid minimum is now `minmax(min(560px,100%),…)`. |
| P2-2 | Match-window heading squeezed to ~210 px at 1024–1279 | Intro keeps a 420 px basis at `lg`, so the countdown wraps below. 1280+ is unchanged. |
| P2-3 | At 300–400 % the hero headline started below the first screen | `short` variant: nav 64 px tall, 12 px from the top; hero top padding 96 px. The headline now starts on the first screen. |
| P2-4 | 50 % zoom left 672 px empty on each side of the landing page | Above 1920 px the page scales as one piece (`fit-landing`: ×1.25 / 1.5 / 2 at 2400 / 2880 / 3840). At 2880 the nav is 2304 px (1536 × 1.5) and the page 14466 px tall (9651 × 1.5): the 1920 composition, larger. |
| P2-5 | Grey band under short portal pages | Shell is a full-height flex column; `main` grows; the `Workspace` panel stretches (stacked: panel row `1fr`, flow support keeps its height) |
| P2-6 | Chat panes capped at 760 px left a band on tall viewports | Panes are `max(420px, var(--svh) − 152px)`: 748 px at 1440×900 (as before) and full height when taller |
| P2-7 | At 50–90 % zoom single portal columns grew while the rest stayed fixed (uneven) | Above 1440 px the portal scales as one piece (`fit-portal`: ×1.11 / 1.33 / 1.67 / 2 / 2.67), so 50 % looks exactly like 100 %, larger (screenshots compared). The zoom sits on `body`, so dialogs scale too. Viewport heights inside use `--svh`. Discover's xl columns are 240 / 448fr / 544fr, so the card keeps the 448 : 544 ratio between steps. |
| P2-8 | Conversation composer off-screen at 150–400 % | `usePrimaryInView` scrolls the conversation header to the top on open (stacked layouts only), and the composer is `layout.stickyActions` (sticky above the tab bar; the pane no longer clips it below `lg`) |
| P2-9 | Discover at 200–400 % opened on the heading and preferences, with the card and Like / Pass far below | Preferences now follow the profile on phones; the deck leads on open; Pass / Like / Super Like are sticky above the tab bar |

### Zoom matrix (after)

Method: as in the audit. Landing on a mock-mode production build (`next start`, port 3006); portal signed in through the mock. ✓ means: no horizontal overflow, no element outside the viewport, no clipped text, no console errors.

**Landing `/`**

| Route | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 50 %: whole page ×1.5 (h1 1025 px = 683 × 1.5). 300–400 %: compact nav 12–76 px, headline on the first screen. |
| 1920×1080: 50 / 200 / 400 | ✓ (×2, page 19303 px) | | | | | | | | ✓ | | | | ✓ (480×270) | |
| Rule 3 widths 360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 | ✓ all | | | | | | | | | | | | | 1920: page 9651 px, the composition unchanged |
| `/how-it-works` direct entry, 100 % and 400 % | ✓ | | | | | | | | | | | | ✓ | the section lands 48 px from the top, and stays there after a refresh |

**Portal: bottom gap and primary control (mock build, 14 routes × 13 zooms + 1920 spot checks + 390×844)**

Routes: `/discover`, `/matches`, `/chats`, `/chats/northpeak`, `/settings`, `/settings/privacy`, `/settings/blocked`, `/profile`, `/stories`, `/notifications`, `/membership`, `/matches/match/goldenhour`, `/dates/venues/goldenhour`, `/games/goldenhour`.
- **Bottom gap** is the grey space between the lowest surface and the viewport bottom, after main's designed padding and the tab bar.
- **Primary control** is the composer on the conversation and Pass / Like / Super Like on Discover, as y-range in a viewport of height h, with the tab bar top t.

| Check | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Horizontal overflow, all 14 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0 of 238 runs |
| Bottom gap, all 14 routes | 0 | 0 | 0 | 0 | 0 | 0 ¹ | 0 | 0 | 0 | 0 | 0 | 0 | 0 | the whole page scales ×2 / ×1.33 / ×1.11 at 50 / 75 / 90 % |
| `/chats/northpeak` composer (y, h, t) | – | – | – | 685–771 / 900 | 603–689 / 818 | 497–583 / 720 | 490–600 / 600 | ✓ | 340–450 / 450 | 218–316 / 360, t 315 | 158–256 / 300, t 255 | 121–219 / 257, t 212 | 83–181 / 225, t 180 | was 663–773 at 200–400 % |
| `/discover` Like / Pass (y, h, t) | – | – | – | 854–910 / 900 ² | ✓ | ✓ | 532–588 / 600 | ✓ | 382–438 / 450 | 280–336 / 360 | 194–250 / 300 | 151–207 / 257 | 119–175 / 225, t 180 | was 523–579 at 200–400 % |
| 1920×1080 spot checks (50 / 200 / 400) | ✓ ×2.67 | | | | | | | | ✓ | | | | ✓ composer 128–226 / 270, Like 164–220 | |
| 390×844 phone | | | | | | | | | | | | | | composer 663–773, Like 712–768, tab bar at 779 ✓ |

¹ At 125 %, the first run left 16 px under the conversation panes, because the pane height assumed the xl padding. They now subtract 136 px at 1024–1279 and 152 px from 1280; re-checked after the rebuild: 0 px at 110 / 125 / 100 / 50 % on `/chats/northpeak` and `/chats`.
² As drawn (Phase 7); multi-column layouts are deliberately not scrolled.

Screenshots: Discover at 50 % is pixel-for-pixel the 100 % layout at twice the size. At 400 %, the conversation opens on the member name and the composer with Send, and Discover opens on the photo with Pass / Like / Super Like pinned above the tab bar.

**Back navigation (browser history; the landing page has no in-page Back, as in Figma)**

| Check | Result |
|---|---|
| `/` (scrolled to 600) → "How it works" (section link) → browser Back | PASS: `/` at scroll 600 |
| `/` (scrolled to 2400) → Get started → `/signup` → browser Back | PASS: `/` at scroll 2400 |
| Direct entry `/how-it-works` at 1440×900 and 360×225 | PASS: section top at 48 px |
| Refresh on `/how-it-works` | PASS: section top at 48 px |

**Functional**
- FAQ: several answers can be open at once (first + two more opened: `true,true,true,false,false`); toggled from the keyboard.
- Nav menu at 400 %: focusable and opens from the keyboard. It lists How it works, Features, Safety, Membership, Log in and Get started. With the compact short-viewport nav (64 px), the menu spans 76–314 px. It runs past the 225 px viewport and scrolls with the page, so every item stays reachable.
- CTAs: Log in → `/signin`; Get started, Find your connection, Create your profile, Or continue in your browser, Start your story → `/signup`.
- App Store and Google Play: `aria-disabled`, with the reasons "Production App Store URL pending" and "Production Google Play URL pending".
- API: none (static page); 0 API requests recorded during the full run.

**Images:** the hero background (`preload`, cover), the collage `PhotoCard`s (eager, cover in aspect boxes), the safety photo with pinned overlays, the download phones (one row, unsquashed at 360 / 768 / 1440 / 2880) and the step images were checked in full-page screenshots at 360, 720, 1152 and 2880 px. Nothing is distorted. The data test checks every landing image's intrinsic size and file.

**Multi-account checks:** N/A. The landing page has no signed-in state, and the portal zoom checks ran on the mock, to avoid revoking the shared staging sessions (see Phase 1).

**Backend / API blockers:** none for this phase.

**Environment notes**
- In PowerShell, `$env:NEXT_PUBLIC_API_BASE_URL = ""` *deletes* the variable, so `.env.local` wins. Build the mock from Bash instead (`NEXT_PUBLIC_API_BASE_URL= npx next build`).
- The production build at the end of this phase was made with the real `.env.local`.

**Remaining issues**
- At 1440×900, Discover's Like / Pass end 10 px below the fold, as drawn (Phase 7). The focus hook deliberately leaves multi-column layouts alone.
- `ScrollToSection` lands sections 48 px from the top: `scroll-mt-6` and `scroll-padding-top: 24px` add up. Harmless (the nav isn't sticky); left as is.
- The nav `<details>` menu doesn't close on Escape or on an outside click (native `details` behaviour). It's keyboard-usable; consider it in Phase 35.
- Zoom-out fit and `--svh` cover the portal and the landing page. Auth, onboarding and legal pages still use raw `svh` and have no fit class; they get them in phases 3–6 (the standing rule is in their prompts).
- The other `usePrimaryInView` targets named in rule 59 (Likes, date planning, membership) come with their phases (10, 15–17, 33).

## Phase 3: Legal pages (Terms, Privacy)

### Pre-change audit (2026-11-16)

Method: headless Chrome 157 over CDP from a scratch script. Each zoom level is emulated as its CSS viewport with `deviceScaleFactor` = zoom (rule 46). No real-zoom browser tool was available in this session. The checks ran against the owner's `next dev` on port 3000 for the audit, then a production build on port 3006 (see environment notes). The pages are static: no API requests.

| Check | Result before |
|---|---|
| Horizontal overflow, `/terms` and `/privacy/information-you-provide`, 13 zooms + 1920 spot checks + rule 3 widths (46 runs) | none |
| Line length | **94 characters** per line at 1600 px and wider (1032 px of 18 px text); 80 at 1440 |
| 50 % zoom (2880 px) | **no fit class**: the 1536 column stayed 1536, leaving 672 px empty on each side |
| Contents list | sticky from 1024 px with no height cap (405 px tall). It fit every matrix viewport, but a wide and short window (e.g. 1280×400) would have hidden its last links. |
| Mobile disclosure | rendered **open on the server** (`useSyncExternalStore` server snapshot `true`), then closed after hydration on phones, so the article jumped up |
| Contents link | scrolled to the section but left focus on the link. Clicking the link of the section already in the URL did nothing (the effect only re-runs when the id changes). |
| Short viewports (300–400 %) | the 112 px solid nav pushed the title down (h1 top 205 px of a 225 px viewport) |
| Console | **Next LCP warning on a plain load** at 250–400 % and at 1920@400: the logo mark was the LCP image and lazy |
| Long words / URLs at 360 px | none overflow (global `break-word`); headings fit |

### Result

| | |
|---|---|
| Status | **Done** (2026-11-16) |
| Routes completed | `/terms`, `/terms/<section>` (8), `/privacy`, `/privacy/<section>` (8) |
| Tests | `npm test`: **11 files, 167 tests, 167 passed, 0 failed** (the 158 earlier tests unchanged, plus 9 new) · `npm run lint`: clean · `npm run build`: compiled, no warnings |

**Files changed**
- `src/components/sections/legal/legal-page.tsx`: `fit-landing`, reading column / measure tokens, focusable sections, `ScrollToSection focus`
- `src/components/pieces/shells/legal-contents.tsx`: rewritten as a CSS-driven button disclosure; sticky only while it fits; closes on pick; re-scrolls an already-open section
- `src/components/pieces/layout/scroll-to-section.tsx`: `focus` prop and the exported `bringIntoView` helper (landing behaviour unchanged)
- `src/components/pieces/shells/site-nav.tsx`: solid variant `short:h-16` (used only by the legal pages)
- `src/components/pieces/brand/logo.tsx`: mark `loading="eager"`
- `src/app/globals.css` (`--container-measure: 75ch`), `src/lib/control-sizes.ts` (`layout.readingColumn`, `layout.readingMeasure`)
- Docs: `AGENTS.md` (registry entries for `LegalContents` and `ScrollToSection`, one Decisions entry), `NEW_FRONTEND_IMPROVEMENT_ROADMAP.txt` (Phase 3 completion tags; owner messaging reports added to phases 12 and 13, see R11 / R12)

**New tests:** `src/data/legal/legal-sections.test.ts` (9):
- for each document, every contents entry builds `/<doc>/<id>` with no hash;
- ids are unique and URL-safe, and each section has a title and a body;
- `sectionFromParam` accepts the root and every id, and rejects unknown, nested, not-found and wrongly cased values;
- Terms stays keyed L02-TC and Privacy L03;
- the footer's Legal links and the moderation warning's "community guidelines" link point at real legal pages / sections;
- the reading text is capped by a `ch` measure token.

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P3-1 | 94-character lines at 1600 px and wider | Body text capped at 75ch (`max-w-measure`); the article keeps its 1088 px column |
| P3-2 | 672 px empty on each side at 50 % zoom | `fit-landing` on `main`: ×1.25 / 1.5 / 2 from 2400 / 2880 / 3840, like the landing page |
| P3-3 | Phone disclosure rendered open, then snapped shut after hydration | Open state is CSS (`hidden` / `lg:block`) plus a button with `aria-expanded` / `aria-controls`; the server and client agree at every width |
| P3-4 | Contents list sticky with no height cap | `lg:max-h-[calc(var(--svh)-4rem)]` with an inner scroll, and `short:static` (never sticky at max-height 420 px) |
| P3-5 | Contents link left focus behind; re-clicking the section already in the URL did nothing | Sections are `tabIndex={-1}` and receive focus after scrolling; a link to the current path calls `bringIntoView` directly; picking a link closes the phone list |
| P3-6 | Title below the first screen at 300–400 % | Solid nav 64 px under `short` (h1 top 157 px, was 205) |
| P3-7 | LCP warning: lazy logo mark | `loading="eager"` on the mark (one shared SVG for every size) |

### Zoom matrix (after)

Production build (`next start`, port 3006). ✓ means: no horizontal overflow, no element outside the viewport, no clipped text, no console errors or warnings. The text column is the body paragraph width, in px and characters.

| Route | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/terms` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 50 %: ×1.5, text 1235 px = 75ch. 75–100 %: 823 px / 75ch. 110 / 125 %: 68 / 57ch. 150 %+: contents is a closed disclosure. 300–400 %: h1 at 157 px. |
| `/privacy/information-you-provide` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | lands on the section at every level |
| 1920×1080: 50 / 200 / 400 (both routes) | ✓ (×2, 1647 px / 75ch) | | | | | | | | ✓ | | | | ✓ (480×270) | |
| Rule 3 widths 360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 (both routes) | ✓ all | | | | | | | | | | | | | 360: 29ch; 1024: 45ch beside the contents |

- **Contents list:** sticky and fully in view at 1024 px and wider (32–445 px of 900 while reading); static at 1280×400.
- **Bottom gap:** none. The page is taller than the viewport at every level (it scales with `--fit` when zoomed out).
- **Primary action:** the contents disclosure, reachable from the keyboard at 400 %.
- **Regression for the shared pieces** (`ScrollToSection`, `Logo`): `/` and `/how-it-works`, 23 runs each, no overflow and 0 console errors. The one element left of the viewport is the existing final-CTA glow (`left-[-26.4%]`, clipped, unchanged).

### Back navigation and functional checks

| Check | Result |
|---|---|
| Contents link → `/terms/membership-and-billing`: URL, scroll, focus on the section | PASS. The section sits at 191 px because the page has reached its end (sections 5–8 can't reach the top at 1440×900). |
| Clicking the same link again after scrolling to the top brings the section back | PASS |
| `/terms` (scrolled to 300) → section 3 → section 7 → Back = `/terms/connections-and-communication` at that section → Back = `/terms` at scroll 300 | PASS |
| Direct entry `/privacy/your-privacy-controls`: scrolls to and focuses the section; refresh keeps it | PASS |
| 400 % (360×225): disclosure starts closed; Enter opens it; all 8 links fit 345 px; Tab reaches the first link; Enter on it opens `/terms/using-the-platform`, closes the list and focuses the section (56 px from the top) | PASS |
| `/signup` with a typed phone → "Terms of Service" → Back = `/signup` with the phone kept | PASS. Scroll is restored trivially: `/signup` doesn't scroll at 1440×900. |
| Footer Legal links and the warning's guidelines link | Unit-tested (targets L02-TC / L03 / `community-conduct`) |
| "Back to 48Date" | unchanged: opens `/` (L02) |
| Console during the functional run | 0 errors / warnings |

**Images:** the only image is the shared logo mark. Its 48×38 box is unstretched in the screenshots at 360×225 (×4), 1440 and 2880 (×1.5). No content images (rule 50 N/A).

**Multi-account checks:** N/A. The pages are public and static.

**Backend / API blockers:** none (static draft copy, rule 28).

**Environment notes**
- The owner's `next dev` on port 3000 served stale modules after my edits. It reported "Export `bringIntoView` doesn't exist" although the file exports it, and parsed `scroll-to-section.tsx` as `globals.css` ("Invalid empty selector"). This is a Turbopack hot-reload glitch, not the code: `npm run build` compiled cleanly and the production server shows no errors. I didn't restart the owner's server. If it still shows the overlay, restarting `next dev` clears it.
- A second `next dev` on port 3001 refuses to start while one runs for the same directory ("Another next dev server is already running"), so the post-change checks used `next start` on 3006.
- Changes in this repo were committed automatically during the phase by a tool outside this session (commits "Update shells: site-nav.tsx and 3 more", "Update src: globals.css and 3 more"). This phase ran no git commands.

**Remaining issues**
- At 1920 px the body text (823 px) leaves ~300 px free to the right of the article. That is the reading-measure trade-off rule 47 allows; headings keep the 1088 px column.
- The landing nav has the same "section link to the current URL does nothing" gap that P3-5 fixed for legal contents (e.g. clicking "How it works" while on `/how-it-works` after scrolling away). `bringIntoView` is ready for it; landing is outside this phase (Phase 35 or a landing touch-up).
- The legal pages have no footer, as in the current design; the footer exists only on the landing page.

## Phase 4: Authentication (Sign up, Sign in, OTP, Google, Session ended)

### Pre-change audit (2026-11-17)

Method: headless Chrome over CDP from a scratch script (no project dependency). Each zoom is emulated as its CSS viewport (window ÷ zoom, `deviceScaleFactor` = zoom), as rule 46 allows. Claude in Chrome was not connected in this session, so real browser zoom wasn't available. Production builds (`next start`): API mode on port 3006 (`.env.local`), mock mode (no `NEXT_PUBLIC_API_BASE_URL`) on 3007 for the client states and SESSION. The owner's `next dev` on 3000 was left alone (a second `next dev` refuses to start beside it).

Found already in the tree: earlier, unrecorded Phase 4 commits (`2d02792`, `c4cf544`, `da6b6e8`, `ca9e3ad`) had added `fit-portal` / `--svh` and short-viewport spacing to `AuthShell`, phone validation fixes and the tests `phone.test.ts`, `steps.test.ts` and `auth-contract.test.ts`. This phase audited that work and finished it.

| Check | Result before |
|---|---|
| `npm test` / `npm run lint` | 14 files, 192 tests, all passed; lint clean |
| `npm run build` | **failed at type check**: `src/lib/auth/steps.test.ts` reads `action.to.screen`, but `Destination` may be `{ notFunctional }` (TS2339 ×4) |
| `/signin`, `/signin/verify`, `/signup/verified`, 13 zooms | no horizontal overflow; 50–90 % scale as one piece (`--fit` 2 / 1.33 / 1.11), photo panel 1296 / 864 / 720 px, no bands; panel switches at 1024 (shown at 110 / 125 %, 570 / 476 px; hidden from 150 %) |
| Short viewports (250–400 %) | **header logo cut off at the top**: the 80px `md` logo in the 56px short header |
| Primary at 400 % | Continue at 440 px and Verify at 204 px of a 225 px viewport; the heading block leads, the field is below the first screen |
| Resend code | **no in-flight guard**: a double click sends two requests and can trip the API's cooldown (429 → OTP-LIMIT) |
| OTP cells | 48 × 64 at 360 px; 46 × 48 at 360 × 225 (≥ 44 px tap target) |
| Console | 0 errors |

### Result

| | |
|---|---|
| Status | **Done** (2026-11-17) |
| Routes completed | `/signup`, `/signup/verify`, `/signup/verified`, `/signup/google`, `/signup/google/error`, `/signin`, `/signin/verify`, `/signin/verified`, `/signin/google`, `/signin/google/error`, `/signin/session-ended`, plus the client states PHONE-ERROR, OTP-FILLED, OTP-ERROR, OTP-RESEND, OTP-EXPIRED, OTP-LIMIT and VERIFY-PROCESS |
| Tests | `npm test`: **16 files, 201 tests, 201 passed, 0 failed** (the 192 earlier tests unchanged, plus 9 new) · `npm run lint`: clean · `npm run build`: compiled, 149 pages, no warnings |

**Files changed**
- `src/lib/routes.ts`: `LinkDestination` type; `to()` returns it (runtime unchanged)
- `src/data/auth/flows.ts`: `verified.next` / `cta` actions typed as link actions (fixes the build break without touching the test)
- `src/components/pieces/brand/logo.tsx`: `auth` size (md that shrinks to the header logo under `short`); size table exported as `logoSizes`
- `src/components/pieces/shells/auth-shell.tsx`: header logo `size="auth"`
- `src/components/sections/auth/phone-step.tsx`, `verify-step.tsx`: `usePrimaryInView` on the number field / code cells; resend guarded (one request at a time, disabled while in flight)
- New tests: `src/data/auth/flows.test.ts` (7), `src/components/pieces/brand/logo-sizes.test.ts` (2)
- Docs: `AGENTS.md` (Logo registry entry, one Decisions entry), this report

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P4-1 | `npm run build` failed type-checking `steps.test.ts` | Link-only actions are typed as such (`LinkDestination`); the test is unchanged |
| P4-2 | Logo clipped at the top of the auth header at 250–400 % | `Logo size="auth"`: 43 × 48 in short viewports |
| P4-3 | At 300–400 % the form opened with the field and button below the first screen | `usePrimaryInView` (rule 59): stacked layouts open on the field when the button is out of view. At 400 %, Verify now ends at 168 px of 225 (was 204, behind the heading) and Continue at 252 (was 440). |
| P4-4 | Resend could fire twice and trip the 429 cooldown | In-flight guard; the link and the "Send a new code" button are disabled while sending |

**New tests**
- `flows.test.ts`: for each flow, every step action (switch, limit, verified cta / next, Google, Google error, session) is a link to a known screen; the setup routing sends unfinished members to `/onboarding/location` and finished ones to `/discover`; Google error offers Google again and the phone entry; SESSION leads to `/signin`.
- `logo-sizes.test.ts`: the auth logo keeps the md size and, under `short`, uses the header logo, which fits the 56px header.
- Already present and passing (earlier commits, run unchanged): `phone.test.ts` (10: BD and the starter countries), `steps.test.ts` (8: verify without a stored phone → entry; setup routing labels), `auth-contract.test.ts` (7: 429 / cooldown → limited, invalid → mismatch, expired / too many → expired, banned, 5xx → failed).

### Zoom matrix (after)

Production build, API mode. ✓ means: no horizontal overflow, no element outside the viewport, no clipped text, the primary reachable (scrolled to and hit-tested), no console errors. **253 of 253 runs passed**: 11 routes × (13 zoom levels at 1440 × 900 + 50 / 200 / 400 % at 1920 × 1080 + the 7 rule 3 widths).

| Route | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/signin` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | panel 1296 / 864 / 720 / 648 / 570 / 476 px, hidden from 150 %; form column 432 px (×fit when zoomed out); 350–400 %: 16 px gutters; opens on the field from 200 % |
| `/signin/verify` (+ OTP-ERROR / EXPIRED / LIMIT, mock) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | cells 62 × 64 at 100 %, 48 × 64 at 360 px, 46 × 48 at 360 × 225; Verify in the first screen at 300–400 % |
| `/signup/verified` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | success art `max-w-full`, unstretched |
| `/signup`, `/signup/verify`, `/signup/google`, `/signup/google/error`, `/signin/google`, `/signin/google/error`, `/signin/verified`, `/signin/session-ended` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | every route ✓ at every level |
| 1920 × 1080: 50 / 200 / 400 (all 11 routes) | ✓ (×2.67) | | | | | | | | ✓ | | | | ✓ (480 × 270) | |
| Rule 3 widths 360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 (all 11) | ✓ all | | | | | | | | | | | | | 1024: panel 400 px (the clamp minimum); 360: Google and Continue buttons 328 px |

- **Bands and bottom gap:** none. Zoomed out, the frame scales as one piece (`fit-portal`), so photo panel and form keep the 648 : 696 split (Decisions). The shell is `min-h-[var(--svh)]`, so short pages fill to the bottom.
- **Primary in view (zoom in):** see P4-3. At 400 %, `/signin` shows the field with Continue 27 px below the first screen (the privacy hint sits between them); the heading is one scroll up.
- **Country picker:** the native `<select>`; the browser opens its own scrollable list inside the viewport at any height.
- **Images:** the couple photo is `object-cover object-top` at panel widths 400–648 px and at 50 % (1296 px). The faces stay in frame in the screenshots. The BD flag is a 20 × 20 box, and the success mark has `max-w-full h-auto`.

### Back navigation, states and API checks

| Check | Result |
|---|---|
| Direct `/signin/verify` and `/signup/verify` with no number → the entry | PASS |
| PHONE-ERROR at 400 %: announced (`role=alert`), no overflow, Continue reachable | PASS |
| OTP-ERROR at 360 × 225 (mock `000000`): announced, "Edit code to continue" reachable | PASS |
| OTP-EXPIRED (mock `999999`): cells disabled, "Send a new code" | PASS |
| OTP-RESEND ×3 → "Check your messages."; 4th → OTP-LIMIT ("Please wait a little."); both actions reachable at 400 % | PASS |
| Verify Back → `/signup` with the number kept (sessionStorage) | PASS |
| Correct code → `/signup/verified` (`replace`); browser Back doesn't reopen verify (it reaches `/signup`, which forwards the now-signed-in member to `/discover`) | PASS |
| Member visiting `/signin` → `/discover` | PASS |
| SESSION: Back "Sign in" → `/signin`; the member is signed out (`/signin` stays open) | PASS (mock, by direct entry, as the prompt requires) |
| Google error Back → entry; Google step Back → entry | PASS |
| Google without a client ID | API mode: "Continue with Google" is `notFunctional` ("Google sign-in isn’t set up"). Mock mode: it opens the simulated Google step. No client ID is configured, so live Google wasn't tested. |
| Auth Backs use flow targets (`AuthShell` `ActionLink`), not the portal trail | PASS (by code; `PortalBack` isn't used in auth) |
| Console during the runs | 0 errors |

**Multi-account checks (API, staging in `.env.local`).** Each account signed in once, in its own fresh Chrome profile: phone → test-code hint → verify → SIGNIN-VERIFIED. No codes or tokens were recorded.

| Account | Code sent | Hint shown (fits at 360 × 225) | Verified screen action | Refresh token stored | Landed |
|---|---|---|---|---|---|
| M1 omar_farooq (…401) | ✓ | ✓ | Open my portal | ✓ | `/discover` |
| M2 rohan_sen (…402) | ✓ | ✓ | Open my portal | ✓ | `/discover` |
| M3 julian_vance (…403) | ✓ | ✓ | Open my portal | ✓ | `/discover` |
| hannah_brooks (…301) | ✓ | ✓ | Open my portal | ✓ | `/discover` |
| maliha_t (…302) | ✓ | ✓ | Open my portal | ✓ | `/discover` |
| shreya_b (…303) | ✓ | ✓ | Open my portal | ✓ | `/discover` |

The prompt's F5–F7 (…105–107) weren't used: the owner's current list (…301–310) replaces them. Signing out of every tab is covered by the existing `api-layer.test.ts` (unchanged, passing) and the SESSION check above.

**Backend / API blockers**
- None new for auth. `POST /auth/phone/request-otp` returns `OTP_COOLDOWN` as an error, which the frontend shows as OTP-LIMIT ("Please wait a little."). A `retryAfterSeconds` field would let the screen show a countdown instead (recommendation, not a blocker).

**Remaining issues**
- At 400 % `/signin` needs one small scroll (27 px) to reach Continue; the privacy hint sits between the field and the button. Reordering is a design change and is left for the owner.
- An intermittent `log`-level Chrome message at 945 px: "sunset-couple.png preloaded but not used". React preloads the eager panel photo, which is hidden below 1024. It's the smallest file (`sizes` 1 px) and appeared in 2 of ~40 sub-1024 runs. Removing `eager` would bring back the ≥1024 LCP warning, so it is left as is.
- Next.js reports a known security advisory for 16.4.3. `next build` / `next dev` stop once to show it and pass on retry. The upgrade is a dependency change and needs the owner's approval.
- The owner's request said "NEW_FRONTEND_QA_REPORT.txt"; the project's report is this `.md` file (rules 58 and 10), so results are recorded here.

### Phase 3 re-check (2026-11-17)

`src/data/legal/legal-sections.test.ts` (9) passes in today's run. The legal matrix was re-run on today's build for `/terms` and `/privacy/information-you-provide` (13 levels + the 1920 spot checks + the rule 3 widths): **46 of 46 runs passed**, with no overflow, nothing outside the viewport and no console messages. Phase 3 stays Done.

## Phase 5: Onboarding A (profile steps 1–11)

### Pre-change audit (2026-11-17)

Method: headless Chrome over CDP from a scratch script (no project dependency). Each zoom is emulated as its CSS viewport (window ÷ zoom, `deviceScaleFactor` = zoom), as rule 46 allows; Claude in Chrome was not connected in this session, so real browser zoom wasn't available. Every account in the owner's list has finished onboarding, so the step-through ran on a **mock-mode production build** (`NEXT_PUBLIC_API_BASE_URL` unset, port 3007); the API was used only for the finished-member redirect. First pass: 18 routes / states × 5 levels (50, 100, 125, 200, 400 %).

| Check | Result before |
|---|---|
| 50–90 % zoom | **The page didn't scale** (`--fit` 1): at 50 % the 560 px column sat in a 2528 px panel, mostly empty. The shell used raw `100svh`. |
| 110 % (1309 px) / 125 % (1152 px) | sidebar 304 px shown at 110 %, hidden at 125 %; column 560 px centred |
| Primary at 200–400 % | **Continue below the first screen on every step**: 52 px (PRIVATE-NAME at 200 %) to 1219 px (INTERESTS at 400 %) below the fold; at 100 % INTERESTS already needed a scroll (Continue at 925 of 900) |
| LOC-MANUAL at 400 % | **horizontal overflow**: `scrollWidth` 358 > `clientWidth` 345 (area result rows) |
| LOC-MANUAL at 360 px | area names truncated ("San Francisco, Califo…") |
| SELECT-OCCUPATION at 225 px height | the dialog scrolled, but the confirm was at the end of the list, out of view, with 32 px padding |
| Back to NICKNAME (mock) | **the D-117 lock was lost**: the mock's `getProgress()` returned `null` on the re-read, which replaced the lock set on save |
| D-117 notice | **copy hard-coded in the component** (rule 9) |
| Back / primary at 360 px | Back 112 × 44, primary 189 × 56, no overlap; long labels truncate (existing decision) |
| Area map pin | visible at every width (art centred on phones) |
| Console | 0 messages |

### Result

| | |
|---|---|
| Status | **Done** (2026-11-17) |
| Routes completed | `/onboarding/location`, `/nickname`, `/private-name`, `/birthday`, `/lifestyle`, `/identity`, `/personality`, `/communication`, `/interests`, `/details`, `/goals`, with LOC-MANUAL, LOC-NORESULT, LOC-DENIED, NICK-CHECK, NICK-TAKEN, the D-117 lock, SELECT-OCCUPATION, AGE-GATE and the required-field errors |
| Tests | `npm test`: **22 files, 242 tests, 242 passed, 0 failed** (the 201 earlier tests unchanged, plus 41 new) · `npm run lint`: clean · `npm run build`: compiled, 149 pages, no warnings |

**Files changed**
- `src/components/pieces/shells/setup-shell.tsx`: `fit-portal` (scales as one piece past 1440), heights in `var(--svh)`, tighter padding in `short` viewports
- `src/components/pieces/shells/setup-step.tsx`: the Back / primary row is sticky at the viewport bottom (white, inside the panel; its padding lies over the panel's, so the frame is unchanged when the step fits); `short:pt-4` heading inset
- `src/components/pieces/forms/option-dialog-field.tsx`: 24 px padding on phones, 16 px in short viewports; the confirm is pinned while the list scrolls
- `src/components/pieces/forms/choice-group.tsx`: `grid-cols-1` (`minmax(0, 1fr)` track)
- `src/components/pieces/forms/option-row.tsx`: `area` names wrap (`break-anywhere`, `min-h-16`); the other variants still truncate
- `src/components/sections/onboarding/nickname-step.tsx`: the nickname rule from `lib/onboarding/nickname-rule.ts` (new); the D-117 notice from data
- `src/data/onboarding/about.ts`: `nicknameStep.locked`
- `src/lib/onboarding/mocks/mock-onboarding-service.ts`: remembers a saved nickname for the tab (`48date.mock.nickname`, cleared on sign-out with every `48date.` key) and reports it as `lockedNickname`, as the API does
- New tests: `src/lib/onboarding/step-payloads.test.ts` (5), `profile-draft.test.ts` (5), `nickname-rule.test.ts` (17), `mocks/mock-nickname-lock.test.ts` (3), `src/test/onboarding-steps-contract.test.ts` (4), `src/components/pieces/shells/setup-layout.test.ts` (7)
- Docs: `AGENTS.md` (registry entries for SetupShell, SetupStep, OptionDialogField, ChoiceGroup and OptionRow; Decisions "Guided setup (Phase 5)"), this report

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P5-1 | 50–90 % zoom left a 560 px column in a 1500–2500 px panel; the shell used raw `svh` | `fit-portal` + `var(--svh)`. At 50 % the frame lays out at 1440 and scales ×2 (sidebar 608, panel 2176, column 1120 device px); 1920 × 1080 at 50 % scales ×2.67 |
| P5-2 | Continue below the first screen at 200–400 % (and on INTERESTS at 100 %) | Sticky action row. Continue now ends inside the first screen on **every** route / state at **every** tested size (e.g. 213 of 225 px at 400 %) |
| P5-3 | LOC-MANUAL scrolled sideways at 400 % (358 > 345 px) | `ChoiceGroup` track `minmax(0, 1fr)` |
| P5-4 | Area names truncated at 360 px | `OptionRow` `area` labels wrap |
| P5-5 | Occupation confirm out of view in short dialogs | confirm pinned; tighter dialog padding |
| P5-6 | Mock: Back to NICKNAME lost the D-117 lock | the mock reports the saved nickname like the API |
| P5-7 | D-117 copy in the component | moved to `data/onboarding/about.ts` |

**Checked, not bugs**
- *Interests showing 7 ticked boxes in the scripted walk:* Next 16 with `cacheComponents` keeps the previous route in the DOM, hidden (React Activity). The script was counting COMMUNICATION's hidden radio. Real mouse clicks, even rapid ones, stop at 5 with the rest disabled. The scripts now read only the visible `<main>`.
- *API mode, Back to NICKNAME:* `saveStep` invalidates `cacheKeys.onboardingState`, so the progress read is refreshed and the lock comes from the server (`steps[nickname].state = DONE`).

### Zoom matrix (after)

Mock production build. After the last change (`OptionRow` wrap) the LOC-* rows (92 runs), `/settings/location` (23) and the 400 % walk were run again: all passed. ✓ means: no horizontal overflow (`scrollWidth` ≤ `clientWidth`), nothing outside the viewport, no clipped text, the primary scrolled to and hit-tested (`elementFromPoint`), Back and primary not overlapping, dialogs inside the viewport, the map pin inside its frame, and no console messages. **506 of 506 runs passed**: 20 routes / states × (13 levels at 1440 × 900 + 50 / 200 / 400 % at 1920 × 1080 + the 7 rule 3 widths), plus the two out-of-scope callers of `ChoiceGroup` (`/onboarding/photos`, `/settings/location`, overflow only).

| Route / state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LOCATION | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | fit 2 / 1.33 / 1.11 at 50 / 75 / 90 %; sidebar 304 at 100–110 %, hidden from 125 %; column 560 → 529 / 433 / 364 / 313 px at 250–400 %, centred (offset 0); pin visible everywhere |
| LOC-MANUAL (results "San…") | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | results wrap at 360 px; was overflowing at 400 % |
| LOC-NORESULT, LOC-DENIED | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | LOC-DENIED at 360 px: "Choose area manually" truncates beside Back (existing decision) |
| NICKNAME, NICK-CHECK, NICK-TAKEN, D-117 lock | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | suggestion chips wrap |
| PRIVATE-NAME | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | first / last side by side from 640 px |
| BIRTHDAY, AGE-GATE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | native date input |
| SELECT-OCCUPATION (dialog) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 560 × 600 at 100 %; scrolls inside from 150 % (560 × 568); 328 × 193 at 360 × 225 with the confirm pinned |
| LIFESTYLE, IDENTITY, DETAILS (+ errors) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | height / weight side by side from 640 px |
| PERSONALITY, COMMUNICATION, GOALS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2-column cards from 640 px, odd last spans; 1 column below |
| INTERESTS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 8 compact cards; Continue pinned when the grid is taller than the screen (from 100 %) |
| 1920 × 1080: 50 / 200 / 400 (all) | ✓ (×2.67) | | | | | | | | ✓ (960 × 540) | | | | ✓ (480 × 270) | |
| Rule 3 widths 360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 (all) | ✓ all | | | | | | | | | | | | | 360: primary 204 px beside Back 112 px; 1024: panel without sidebar; 1280: sidebar 304 + panel 928 |

- **Bands and bottom gap:** none. The shell is a full-height column (`min-h-[var(--svh)]`) on every route; the only grey is the designed 24 px gutter around the panel (from 768 px, ×fit when zoomed out; 12 px in short viewports). The page height never falls short of the viewport (0 of 506 runs).
- **Primary in view (zoom in):** the sticky row keeps Back / Continue on the first screen; the heading and fields scroll above it. The sidebar is hidden from 125 % (below 1280 px), so it never competes with the form.
- **Focus and keyboard:** the steps are forms, so Enter continues. The sticky row stays in DOM order after the fields, so tab order is unchanged. The dialog keeps the Radix focus trap and its close button.
- **Images:** the area map art is 480 px wide and centred on phones (`max-w-none` inside an `overflow-hidden` frame); the pin stays inside the frame at every width. Choice-card icons are `Icon` masks. Photos belong to Phase 6.

### Back navigation and functional checks (mock walk-through)

The same script ran the full flow by real mouse clicks on the primary, at **1440 × 900 (100 %)** and at **360 × 225 (400 %)**: **41 of 41 checks passed at each size**.

| Check | Result |
|---|---|
| LOCATION "Use my location" with the permission refused → LOC-DENIED; Back → LOCATION | PASS |
| LOC-MANUAL "zzzz" → LOC-NORESULT; "Search another area" clears the field | PASS |
| "Dha" → Dhaka listed → "Use Dhaka" → NICKNAME; the draft holds the label "Dhaka" and no coordinates | PASS |
| Nickname "1x" → the rule message; "GoldenHour" → NICK-CHECK → NICK-TAKEN with suggestions; "Sunny_1" → PRIVATE-NAME | PASS |
| PRIVATE-NAME empty → the required-field errors; filled → BIRTHDAY | PASS |
| SELECT-OCCUPATION inside the viewport with its confirm visible (also at 360 × 225); the choice applies on confirm | PASS |
| Birthday 16 years ago → AGE-GATE; "Check my birthday" → field again; adult → LIFESTYLE | PASS |
| LIFESTYLE → IDENTITY → PERSONALITY → COMMUNICATION → INTERESTS (cap of 5, the rest disabled) → DETAILS → GOALS → PHOTOS | PASS |
| Browser Back → GOALS and DETAILS with their answers | PASS |
| Step Back links DETAILS → … → NICKNAME follow `data/onboarding/flow.ts` (8 hops) | PASS |
| Back on NICKNAME shows "Sunny_1" disabled with the D-117 notice; Continue moves on with no new check | PASS |
| PRIVATE-NAME keeps its answers; a refresh keeps them (sessionStorage draft) | PASS |
| NICKNAME Back → LOCATION; LOCATION Back targets PHONE-VERIFIED (`/signup/verified`); sidebar "Back to website" → `/` (data) | PASS |
| Console errors during the walk | 0 |

**API checks** (`npm run build` with `.env.local`, port 3006, staging API).

| Check | Result |
|---|---|
| hannah_brooks (…301, onboarding finished) signed in through the test-code hint (code read from the page, not recorded) → SIGNIN-VERIFIED | PASS |
| Direct `/onboarding/nickname` → `/matches` (reads `GET /onboarding`) | PASS |
| Direct `/onboarding/location` → `/matches` | PASS |
| Direct `/onboarding/details` → `/matches` (`GET /onboarding/options` 200) | PASS |
| Exceptions | none |

- **Contract (Postman replay):** `onboarding-steps-contract.test.ts` walks screens 1–11 in setup order against the collection and checks the PUTs per screen, in the API's order. Its first case is: location; nickname; real_name; birthday; LIFESTYLE → smoking + drinking (kids waits for gender); IDENTITY → gender + kids + interested_in; PERSONALITY / COMMUNICATION → nothing; interests; DETAILS → height + weight (languages / education / religion wait for looking_for); GOALS → looking_for + languages + education + religion. Every body uses only the collection's fields and its enum values. The location is rounded to 0.01°. A missing earlier answer is asked for ("Please go back and answer “nickname” first.") instead of being sent, and a refused step shows the API's message.
- **Options:** with the API on, the select lists and interests come from `GET /onboarding/options` (`toStepOptions`, unchanged; covered by the existing contract tests). The starter lists show only in mock mode or when the read fails.
- **Nickname:** checked on Continue, not while typing (one request per attempt; no debounce needed). The rule is 3–20 characters, starting with a letter, then letters / digits / `_` / `.` (`nickname-rule.test.ts`). An availability read that fails lets the save decide; a conflict comes back as the step's error.

**Backend / API blockers**
- None new for these steps.
- *Recommendation:* `GET /onboarding/nickname-availability` returns only `available`; returning the reason (format, reserved, taken) would let the screen show the right message without a second request.

**Remaining issues**
- At 360 px the primary label truncates beside the 112 px Back when it is long ("Choose area manually", "Use San Francisco"). This is the existing phone decision, and the accessible name stays complete. Making Back icon-only on phones would be a design change for the owner.
- Real browser zoom wasn't available (no Claude in Chrome connection); all levels were emulated as CSS viewports with `deviceScaleFactor`.
- A first full `npm test`, run while the zoom matrix kept the machine busy, timed out the first two `api-contract.test.ts` cases (5 s default). The unchanged file passed 32 / 32 on its own, and the final full run on a quiet machine passed 242 / 242.
- `/onboarding/nickname` asks for nickname suggestions before a finished member is redirected (one extra read). Harmless; left as is.
- The owner asked for "NEW_FRONTEND_QA_REPORT.txt"; results are recorded in this `.md` file (rules 10 / 58), as in Phase 4.

---

## Phase 6: Onboarding B (photos, selfie verification, notifications, READY)

### Pre-change audit (2026-11-17)

Method: as in Phase 5, headless Chrome over CDP with each zoom emulated as its CSS viewport (`deviceScaleFactor` = zoom). Claude in Chrome was not connected, so real browser zoom wasn't available. Chrome's fake camera (`--use-fake-device-for-media-stream`) stood in for a webcam. Test photos were generated in the page at 16:9 (JPG), 9:16 (JPG), 4:3 (PNG), 3:4 (WebP) and 1:1 (JPG), plus a 10 MB + 4 KB file. The flow ran on the mock-mode production build; the API was used for the verified-member check. The audit was done by reading the four steps and their pieces, then confirmed on the first run.

| Check | Result before |
|---|---|
| PHOTO-PREVIEW | **Cropped**: `PhotoTile frame="preview"` is `object-cover`, so a 16:9 or 9:16 photo was cut to the frame before the member confirmed it |
| Grid tiles (232 px) | cover, centred (`object-position: 50% 50%`); faces in tall photos could be cut at the top |
| SelfieFrame | fixed 300 px surface. At 360 × 225 (400 %) the frame was taller than the screen; the capture button sat below it (the sticky row from Phase 5 now keeps it reachable) |
| Camera release | **Leak**: if the member left (Back, "Not now", another page) while the browser was still asking for the camera, the stream granted afterwards was stored and never stopped. On VERIFY it also reopened VERIFY-CAPTURE after the member had gone back (PHOTOS and VERIFY). |
| READY interests | **Empty with the API on**: the card matched the draft's interest ids (API UUIDs) against the Figma card keys |
| File check | inline in the component, untested; a 0-byte file passed |
| 50–90 % zoom, the action row | already covered by Phase 5's `SetupShell` / `SetupStep` fixes (fit-portal, sticky row) |
| Console | MediaPipe prints its own `W…` / `I…` log lines (OpenGL, "CPU only ops") on VERIFY-CAPTURE; library diagnostics, not app errors |

### Result

| | |
|---|---|
| Status | **Done** (2026-11-17) |
| Routes completed | `/onboarding/photos` (empty grid, PHOTO-SOURCE, PHOTO-PREVIEW, PHOTO-UPLOAD, PHOTO-ERROR, PHOTO-READY, live camera), `/onboarding/verify` (INTRO, CAMERA, DENIED, CAPTURE auto / by hand, REVIEW, PENDING, RETRY, DONE, STATUS), `/onboarding/notifications` (NOTIFY, NOTIFY-DENIED), `/onboarding/ready` |
| Tests | `npm test` → 27 files, 277 tests: **277 passed** (2026-11-18). A first full run while the machine was busy failed 2 / 277: `api-contract.test.ts` › auth › "requests and verifies a code" timed out at 5 s, and its late `POST /auth/phone/verify` landed in the next case ("signs in with Google"), which then saw the wrong call. The unchanged file passed 32 / 32 alone and the full suite 277 / 277 on the rerun; `signInWithGoogle` does call `POST /auth/google` with `{ idToken, device }`, so no code changed. `npm run lint`: clean. `npm run build` (mock): clean on the second attempt; the first compiled and generated all 149 pages, then exited 1 at Next's security-advisory lookup. |

**Files changed**
- `src/components/sections/onboarding/photos-step.tsx`: PHOTO-PREVIEW uses `MediaFrame` (whole photo, its own ratio); the file check uses `isAcceptedPhoto`; camera requests are numbered so a late grant is released
- `src/components/sections/onboarding/verify-step.tsx`: the same camera guard; Back on VERIFY-CAMERA cancels a pending request
- `src/components/sections/onboarding/ready-step.tsx`: interests through `interestChoices` (API ids → cards)
- `src/components/pieces/media/photo-tile.tsx`: `tile` / `manage` frames are centre-top (`object-top`); `preview` (story) unchanged
- `src/components/pieces/media/selfie-frame.tsx`: height `selfieFrameHeight` (300 px, shrinking to no less than 160 px in short viewports)
- `src/lib/control-sizes.ts`: `selfieFrameHeight`
- `src/lib/onboarding/photo-file.ts` (new): `isAcceptedPhoto`
- `src/lib/onboarding/api-onboarding-service.ts`: `decideVerification` extracted (and `fromSnapshot` exported) for tests; behaviour unchanged
- New tests: `src/lib/onboarding/photo-store.test.ts` (5), `photo-file.test.ts` (11), `verification-decision.test.ts` (6), `src/test/onboarding-media-contract.test.ts` (7), `src/components/sections/onboarding/onboarding-media.test.ts` (6)
- Docs: `AGENTS.md` (PhotoTile and SelfieFrame entries; Decisions "Onboarding photos, verification, notifications, READY (Phase 6)"), this report

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P6-1 | PHOTO-PREVIEW cropped the photo | `MediaFrame`: each tested ratio is framed at its own ratio (16:9 → 1.778, 9:16 → 0.563, 4:3 → 1.333, 3:4 → 0.75, 1:1 → 1.000), `object-fit: contain`, capped by height |
| P6-2 | A camera granted after the member left stayed on (and VERIFY reopened the capture) | numbered requests: the late stream is stopped at once, and the screen stays where the member went |
| P6-3 | READY showed no interests with the API on | API ids mapped back to the cards |
| P6-4 | Tiles centred, cutting faces | centre-top |
| P6-5 | The selfie surface was taller than a 225 px viewport | `selfieFrameHeight`: 300 → 194 px at 200 %, 160 px at 400 % |
| P6-6 | A 0-byte file passed the photo check | `isAcceptedPhoto` refuses it (same copy) |

### Zoom matrix (after)

Mock production build (2026-11-18 rerun). VERIFY-CAPTURE (auto check) logged MediaPipe's own "INFO: Created TensorFlow Lite XNNPACK delegate" line at all 23 sizes; it is a library diagnostic, so those runs count as passes (strictly, 460 / 483 had no console line at all). ✓ means: no horizontal overflow, nothing outside the viewport, no clipped text, the primary scrolled to and hit-tested, Back and primary not overlapping, previews at their own ratio and contained, and no app console messages. **483 / 483 passed**: 21 routes / states × (13 levels at 1440 × 900 + 50 / 200 / 400 % at 1920 × 1080 + the 7 rule 3 widths).

| Route / state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
| PHOTOS (empty grid) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| PHOTO-SOURCE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| PHOTO-PREVIEW portrait 9:16 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | frame 0.563 = photo 0.563, contain, 512 px tall at 100 %, 135 px at 400 %; 1920 / rule-3 widths: 10/10 |
| PHOTO-PREVIEW landscape 16:9 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | frame 1.778 = photo 1.778, contain, 315 px tall at 100 %, 135 px at 400 %; 1920 / rule-3 widths: 10/10 |
| PHOTO-UPLOAD | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| PHOTO-ERROR (offline) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| PHOTO-READY (2 photos) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | tiles cover/50% 0%; 1920 / rule-3 widths: 10/10 |
| PHOTOS camera view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | selfie surface 300 / 194 / 160 px at 100 / 200 / 400 %; 1920 / rule-3 widths: 10/10 |
| VERIFY-INTRO | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| VERIFY-CAMERA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 360 px: "Allow camera & continue" truncates (phone decision); 1920 / rule-3 widths: 10/10 |
| VERIFY-DENIED | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 360 px: "Open browser settings" truncates (phone decision); 1920 / rule-3 widths: 10/10 |
| VERIFY-CAPTURE (auto check) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | selfie surface 300 / 194 / 160 px at 100 / 200 / 400 %; 360 px: "Capturing automatically" truncates (phone decision); 1920 / rule-3 widths: 10/10 |
| VERIFY-CAPTURE (Take selfie by hand) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | selfie surface 300 / 194 / 160 px at 100 / 200 / 400 %; 1920 / rule-3 widths: 10/10 |
| VERIFY-REVIEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | selfie surface 300 / 194 / 160 px at 100 / 200 / 400 %; 1920 / rule-3 widths: 10/10 |
| VERIFY-PENDING | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| VERIFY-RETRY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| VERIFY-DONE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| VERIFY-STATUS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| NOTIFY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| NOTIFY-DENIED | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| READY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1920 / rule-3 widths: 10/10 |
| 1920 × 1080: 50 / 200 / 400 (all) | ✓ (×2.67) | | | | | | | | ✓ (960 × 540) | | | | ✓ (480 × 270) | |
| Rule 3 widths 360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 (all) | ✓ all | | | | | | | | | | | | | |

- **Bands and bottom gap:** none; the frame scales as one piece below 100 % (fit 2 / 1.33 / 1.11) and fills the viewport height on every state.
- **Primary in view:** the sticky row keeps Use photo, Take photo, Take selfie, Submit selfie, Enable notifications and See my matches on the first screen at every size. "Capturing automatically" truncates beside Back at 360 px (the existing phone decision).
- **Images:** previews uncropped at their own ratio (see P6-1). Tiles are cover, centre-top (`50% 0%`). The selfie is a 180 : 300 portrait, mirrored as seen. The upload thumbnail is 64 × 80 cover.

### Back navigation and functional checks (mock walk-through)

Real mouse clicks on each primary, at **1440 × 900 (100 %)** and **360 × 225 (400 %)**: **45 / 45 at 1440 × 900 (100 %) and 45 / 45 at 360 × 225 (400 %)**.

| Check | Result |
|---|---|
| Empty grid: Continue disabled ("Add 2 more photos"); one photo: "Add 1 more photo" | PASS |
| Over 10 MB → the existing copy ("Choose a JPG, PNG or WebP photo under 10 MB.") | PASS |
| PHOTO-PREVIEW: JPG 16:9, JPG 9:16, PNG 4:3, WebP 3:4 and JPG 1:1, each uncropped at its own ratio | PASS |
| PHOTO-UPLOAD shows progress; offline → PHOTO-ERROR; Retry online → added | PASS |
| Make main reorders; Remove drops below the minimum and disables Continue | PASS |
| Camera: live view; Take photo → PHOTO-PREVIEW with the camera released; Back from the camera releases it | PASS |
| Back while the browser is still asking (1.5 s delayed grant): the stream is stopped, the camera doesn't reopen, the grid keeps its photos | PASS |
| PHOTO-READY Back → GOALS (`/onboarding/goals`); Continue saves → VERIFY-INTRO | PASS |
| VERIFY: delayed grant + Back → stream stopped, intro shown | PASS |
| VERIFY-CAPTURE (check blocked → "Take selfie" by hand) reachable at 400 % (selfie surface 160 px); Back → camera step with the camera released | PASS |
| Take selfie → VERIFY-REVIEW (camera released) → Submit → VERIFY-PENDING → decided: DONE at 100 %, RETRY with the "too dark" reason at 400 % (the mock judges brightness; Chrome's fake frame landed on both sides) | PASS |
| Refresh / direct entry shows the stored result (DONE); DONE Back → VERIFY-STATUS ("Verified") | PASS |
| "Skip for now" → NOTIFY; NOTIFY Back → `/onboarding/verify` | PASS |
| Notification permission not asked on load; asked once from the click; refused → NOTIFY-DENIED; its Back → NOTIFY; granted → saved → READY | PASS |
| READY shows the nickname and the chosen interests; Back → `/onboarding/notifications`; "See my matches" → `/matches` | PASS |
| No camera left live at the end; no app console errors | PASS |

**API checks** (staging API, `npm run build` with `.env.local`, port 3006)

- **M1 omar_farooq on `/onboarding/verify` (expect VERIFY-DONE, Back → VERIFY-STATUS "Verified"):** not re-run on 2026-11-18; handed to the browser tester (`PHASE7_TEST_HANDOFF.md`, section D). The same check passed in the Phase 6 session of 2026-11-17, and no Phase 6 code changed since.

- **Contract (Postman replay, `onboarding-media-contract.test.ts`):**
  - `POST /files` sends a multipart body with `file` and `purpose` `PROFILE_PHOTO` / `VERIFICATION_SELFIE` and the bearer token. It reports progress (50 % while sending, 100 % once confirmed) and returns `fileId`; a 413 is `failed`, never uploaded.
  - `PUT /onboarding/steps/photos` sends `{ photos: [{ fileId, isMain }] }` with the first photo main, and leaves out photos without a file id.
  - `POST /verification` sends `{ selfieFileId }`. QUEUED is "pending" and the attempt id is remembered. The snapshot `PASSED` reads as verified. A refused selfie upload goes to RETRY without starting a review.
- **Verification decision (`verification-decision.test.ts`):** attempt statuses map to pending / verified / retry, and unknown ones read as still in review. The profile's VERIFIED wins. An attempt still in review once the profile has left PENDING counts as decided against. The reason is the reviewer's note or the first code.
- **READY / matching:** `startMatching()` sends one `POST /matching/runs` (a second start joins the same run) and follows it live through `/matching/runs/:id/events` (new contract test). MATCHES then shows "Looking for matches…" (Phase 11 owns that screen).

**Backend / API blockers**
- None new.
- *Recommendation:* `POST /verification` accepts `accessibilityRequested` (for members who can't make the hand sign). The web app doesn't offer it: when the on-device check can't load, "Take selfie" is pressed by hand without a V sign. An owner decision is needed on whether to send `accessibilityRequested: true` on that path.

**Remaining issues**
- Chat, story and PHOTO-MANAGE still check files inline (same rule as `isAcceptedPhoto`); to be switched in Phases 13, 22 and 26.
- STORY-CREATE's photo preview still uses the cropping `PhotoTile frame="preview"` (Phase 22).
- MediaPipe's own `W…` / `I…` console lines on VERIFY-CAPTURE come from the library's wasm and can't be silenced without patching it; they're not app errors.
- In-memory photos are gone after a refresh (existing decision, rule 34), so READY then shows the placeholder.
- Real browser zoom wasn't available; all levels were emulated as CSS viewports with `deviceScaleFactor`.
- The owner asked for "NEW_FRONTEND_QA_REPORT.txt"; results are recorded in this `.md` file (rules 10 / 58).

---

## Phase 7: Discover deck and match moment

### Pre-change audit (2026-11-18)

Method: headless Chrome over CDP, each zoom emulated as its CSS viewport (`deviceScaleFactor` = zoom). No browser tool (Claude in Chrome, the built-in browser) was connected, so real browser zoom wasn't available; the real-zoom and multi-account checks are handed to the browser tester (`PHASE7_TEST_HANDOFF.md`). The matrix ran on the mock production build, first on the build without the Phase 7 changes ("before"), then with them ("after"). Figma: W / DISCOVER (21727:4800) is 1440 × 974; its decision row sits at y 856–912, so even the frame puts Pass / Like / Super Like below a 900 px screen.

| Check | Before |
|---|---|
| First screen at 100 % (1440 × 900, 1280 × 800, 1366 × 768, 1920 × 1080) | **Fail**: the 448 × 464 photo pushed the decision row to 854–910 px at 1440 × 900 (owner report 2026-11-17: only the photo and name show) |
| Zoom 50–125 %, 1280 / 1440 / 1920 widths | **Fail**: the same row started below the first screen (39 of 156 checks) |
| 150–400 %, 360–1024 widths | pass: the row is sticky above the tab bar (Phase 1 / 2), the deck leads (`usePrimaryInView`) |
| MATCH-NEW, DISCOVER-EMPTY, FILTERS-EMPTY | pass at every size (actions reachable by scrolling, none under the tab bar) |
| Matrix total | **117 / 156** |
| MATCH-NEW timer | **Rule 3 bug**: a fixed "48:00:00", also for a background match made hours earlier |
| Weekly Super Like limit (429) | **Bug**: the member was marked decided before the swipe, so the next deck read dropped the refused card |
| A decision failing offline / 5xx | **Bug**: no message (`failureReason` is null for non-4xx) |
| DISCOVER-EMPTY / FILTERS-EMPTY Back | `router.back()` directly; direct entry could leave the app |
| xl columns at 110 % (1309 px) | third column 413 px; fits, no change needed |
| Decision buttons at 360 px | already `min-w-0` flex shares (136 : 136 : 152); no change needed |

### Result

| | |
|---|---|
| Status | **Code done, automated checks done** (2026-11-18). Real-zoom and multi-account API checks handed to the browser tester. |
| Routes | `/discover` (DISCOVER, DISCOVER-NEXT, SWIPE-PASS / LIKE / SUPER, MATCH-NEW, DISCOVER-EMPTY, FILTERS-EMPTY) |
| Tests | `npm test` → 33 files, 311 tests: **311 passed** (277 existing, unchanged; 16 Phase 7; 18 Phase 8). `npm run lint`: clean. `npm run build` (API, `.env.local`): clean, 149 pages; the mock build for the matrix: clean. |

**Files changed**
- `src/components/pieces/cards/swipe-card.tsx`: photo capped by `swipePhotoFrame`, cropped centre-top
- `src/lib/control-sizes.ts`: `swipePhotoFrame` (464 px at most; from 1024 px it leaves 31rem below the photo, stacked layouts 21.5rem)
- `src/components/sections/portal/discover/match-new-screen.tsx` (new): MATCH-NEW with the live server deadline
- `src/components/sections/portal/discover/discover-view.tsx`: uses `MatchNewScreen`, the deck rules from `deck-intent`, the shared Back on the empty states, fallback copy for a failed decision
- `src/lib/portal/deck-intent.ts`: `SWIPE_PX`, `dragDecision`, `swipeAction`, `LOW_WATER`, `needsNextPage`, `matchToShow`
- `src/lib/portal/api-portal-service.ts`: a refused swipe is no longer kept as decided; uses the deck rules
- `src/data/portal/discover.ts`: `matchNew.timerLive` / `timerLiveLabel`, `card.failed` (design-silent)
- New tests: `src/lib/portal/deck-intent.test.ts` (6), `src/test/discovery-swipes-contract.test.ts` (4), `src/components/sections/portal/discover/discover-deck.test.ts` (6)
- Docs: `AGENTS.md` (SwipeCard, MatchNewScreen, Decisions "Phase 7")

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P7-1 | Pass / Like / Super Like below the first screen at 100 % (and 50–125 %) | photo capped by the viewport: at 1440 × 900 the card ends at 784 px and the row at 796–852 px |
| P7-2 | MATCH-NEW showed a fixed 48:00:00 (rule 3) | counts down to the match's `expiresAt` through `useMatchClock` ("hours:minutes") |
| P7-3 | A Super Like refused by the weekly limit (429) dropped the card on the next read | the member leaves `decided` when the swipe isn't recorded (contract test proves it failed before) |
| P7-4 | A decision failing offline / 5xx showed nothing | "That didn’t go through. Try again." under the buttons; the card stays |
| P7-5 | Empty-state Back called `router.back()` | shared history-first `PortalBack` (fallback DISCOVER) |

### Zoom matrix (after)

Mock production build, emulated zoom. ✓ = no horizontal overflow, nothing outside the viewport, no clipped text, no side bands, no bottom gap, the decisions (deck) or every action (status screens) reachable, no console messages; at 100 % in the four desktop windows the whole card and the decision row are on the first screen. **156 / 156 passed** (before: 117 / 156).

| Route / state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | 1920 × 1080 50 / 200 / 400 | Rule 3 widths | Desktop windows (rule 60) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DISCOVER (Wildflower) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | photo 446x404 at 100 %, 311x160 at 400 % (sticky row); cover 50% 0% |
| DISCOVER-NEXT (GoldenHour) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | photo 446x404 at 100 %, 311x160 at 400 % (sticky row); cover 50% 0% |
| SWIPE-PASS feedback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | photo 446x404 at 100 %, 311x160 at 400 % (sticky row); cover 50% 0% |
| MATCH-NEW | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | every action reachable |
| DISCOVER-EMPTY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | every action reachable |
| FILTERS-EMPTY | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | every action reachable |

- **First screen (rule 60):** at 100 % the card ends / the decision row ends at 784 / 852 px (1440 × 900), 684 / 752 (1280 × 800), 652 / 720 (1366 × 768) and 925 / 1015 (1920 × 1080, fit 1.33); photo 446 × 404, 304, 272 and 595 × 419. Type sizes unchanged from the Figma node (20 px name, 14 px details, 14 px button labels).
- **Bands / bottom:** none at any size; 50–90 % scale as one piece (fit 2 / 1.33 / 1.11).
- **Images:** the card photo is `object-cover` centre-top (`50% 0%`) in its 448-wide frame, never stretched (the drag is a transform on the whole card). The match-moment photo is the 96 px round `Avatar` (1:1). The placeholder is used for a missing API photo (unchanged).

### Back navigation

| Path | Result |
|---|---|
| DISCOVER main state | no Back (hub) — PASS (source) |
| MATCH-NEW → Back | keeps discovering (client state) — PASS (source test) |
| DISCOVER-EMPTY / FILTERS-EMPTY → Back | history-first, fallback `/discover` — PASS (source test); real-browser check handed over |
| Discover → profile → Back keeps the card; Filters → Save → replace | handed to the browser tester (Save is now a replace, Phase 8) |

### API checks

Handed to the browser tester (`PHASE7_TEST_HANDOFF.md`, section C): deck on 402 rohan_sen, drag and buttons, the weekly Super Like limit, a mutual like with a FREE female from the owner's list (MATCH-NEW for her at once, for him from `/matches/unseen`), paging. The contract tests cover the request shapes, the 429 and the unseen / seen calls.

**Backend / API blockers**
- None found in this phase's contract.

**Remaining issues**
- The left preferences column (680 px as drawn) runs below the first screen at 1280 × 800 and 1366 × 768; it is secondary, and the card and decisions fit.
- MATCH-NEW shows "hours:minutes" (design-silent); Figma draws "48:00:00".
- Real browser zoom and the multi-account checks are pending with the browser tester.

---

## Phase 8: Discovery filters

### Pre-change audit (2026-11-18)

Method as in Phase 7 (headless Chrome, emulated zoom; real-zoom and multi-account checks handed to the browser tester). The audit read `filters-view.tsx`, `preference-facts.ts`, the API service and the Postman examples of `GET` / `PUT /discovery/preferences`.

| Check | Before |
|---|---|
| Save → DISCOVER | `router.push`: Back from the deck reopened the saved form (rule 51) |
| Save refused by the API | **Bug**: `catch {}` swallowed it; nothing was shown |
| Reset refused by the API | **Bug**: no error handling; the buttons stayed "busy" for good and the rejection went unhandled. The collection's `PUT` answers **403 ENTITLEMENT_REQUIRED** for verified-only on a free plan, and the defaults Reset restores have verified-only on, so Reset could hang for every FREE member |
| `GET /discovery/preferences` failing | **Bug**: only the heading showed, no error state or Retry |
| Show matches at 200–400 % | the row wasn't pinned; at 225 px tall it sat below the form |
| Age validation 18–80, "Saving…", defaults, miles ↔ km | correct; kept |
| Images | N/A (the screen has only icon masks) |

### Result

| | |
|---|---|
| Status | **Code done, automated checks done** (2026-11-18). Real-zoom and multi-account API checks handed to the browser tester. |
| Routes | `/discover/filters` (FILTERS, with the age error, with a save failure); saving opens DISCOVER |
| Tests | `npm test` → 33 files, 311 tests: **311 passed** (277 existing, unchanged; 16 Phase 7; 18 Phase 8). `npm run lint`: clean. `npm run build` (API, `.env.local`): clean, 149 pages; the mock build for the matrix: clean. |

**Files changed**
- `src/components/sections/portal/discover/filters-view.tsx`: Save / Reset through one guarded path with `replaceRoute`, the failure note (`failureReason` or `copy.failed`), the load-failed state, the pinned side-by-side action row
- `src/lib/portal/preference-facts.ts`: `parseAge`, `distanceFromKm`, `distanceToKm` (moved from the view and the API service, unchanged behaviour)
- `src/lib/portal/api-portal-service.ts`: uses them
- `src/data/portal/discover.ts`: `filters.failed` (design-silent)
- New tests: `src/lib/portal/preference-facts.test.ts` (7), `src/test/discovery-preferences-contract.test.ts` (6), `src/components/sections/portal/discover/discovery-filters.test.ts` (5)
- Docs: `AGENTS.md` (Decisions "Phase 8")

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P8-1 | Save / Reset used `router.push` | `replaceRoute` to DISCOVER |
| P8-2 | A refused save showed nothing | the API's reason (or the form's own copy) under the form; every value kept |
| P8-3 | A refused reset stayed busy for good (403 for FREE members) | same guarded path; the buttons come back with the message |
| P8-4 | A failed read showed an empty page | load-failed state with Retry |
| P8-5 | Show matches below the form at 200–400 % | pinned above the tab bar below 1024px, side by side on phones |

### Zoom matrix

Mock production build, emulated zoom, FILTERS and FILTERS with the age error shown (min 17, max 90). ✓ = no overflow, nothing outside, no clipping, no bands, no bottom gap, Show matches and Reset filters on screen at open and hit-testable, no console messages; at 100 % in the desktop windows the form and both actions are on the first screen. **52 / 52 passed**.

| Route / state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | 1920 × 1080 50 / 200 / 400 | Rule 3 widths | Desktop windows (rule 60) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| FILTERS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | both actions on screen at open |
| FILTERS (age error shown) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 10/10 | 3/3 | both actions on screen at open; age errors shown |

### Back navigation

| Path | Result |
|---|---|
| FILTERS Back | history-first `PortalBack`, fallback DISCOVER (unchanged) |
| Save / Reset | replace to DISCOVER — PASS (source test); real-browser check handed over |
| Refresh on `/discover/filters` | values re-read from `GET` (TanStack `useLoaded`) |

### API checks

- **Contract (`discovery-preferences-contract.test.ts`):** GET maps `maxDistanceKm: null` to Any distance and saved interests to "Share one of my interests"; PUT sends miles as whole km (Any = `null`) and the member's interest ids; the saved values are re-read from the 202 answer without a second GET; the next deck starts a new run; Reset sends the defaults; the 403 `ENTITLEMENT_REQUIRED` and 400 `VALIDATION_FAILED` reach the form as the API worded them.
- **Live (handed to the browser tester):** change 402 rohan_sen's distance and age, confirm the deck changes, then restore them; don't change 403 julian_vance's `interestedIn EVERYONE`.

**Backend / API blockers**
- None new. Note for the owner: the API makes verified-only a Premium filter (`ADVANCED_FILTERS`) while the app's defaults turn it on, so Reset filters on a FREE account is refused (now with the API's message). A product decision is needed: default verified-only off for FREE members, or hide / lock the box for them.

**Remaining issues**
- A distance saved elsewhere (the app) above 80 km reads as 50 miles and is saved back as 80 km if the member presses Show matches.
- A saved age above 80 (the API allows 18–100) fails the form's 18–80 check until the member changes it.

---

## Phase 9: Member profile details and compatibility

### Pre-change audit (2026-11-18)

Method: headless Chrome over CDP, zoom emulated as CSS viewports (`deviceScaleFactor` = zoom); no browser tool was connected. Real-zoom, Back-from-every-entry and multi-account checks are handed to the browser tester (`PHASE9_10_TEST_PROMPT.md`). The audit read `profile-view.tsx`, `profile-decisions.tsx`, `compat-view.tsx`, `shared-interests.ts`, `api-members.ts` and the Postman examples of `GET /discovery/profile/:nickname`.

| Check | Before |
|---|---|
| Back | **Bug**: an `ActionButton` link "Back to discovery" to DISCOVER, so Back from Likes, Compat, a conversation or match details all opened Discover (rule 51) |
| Main photo | `lg:aspect-auto`: from 1024px the frame stretched to the text column's height and cropped from the centre |
| More photos | **Bug**: fixed 320px height, `object-bottom` (faces cut off at the top) |
| Decisions | `router.push` to DISCOVER (Back reopened the decided profile); not pinned at 200–400 % |
| Shared interests | inline intersection by id only, untested |
| COMPAT signal bars, MEMBER-UNAVAILABLE | correct (samples / `availability` and 404 → MEMBER-UNAVAILABLE) |

### Result

| | |
|---|---|
| Status | **Code done, automated checks done** (2026-11-18). Real-zoom, Back-from-every-entry and API checks with the browser tester. |
| Routes | `/discover/profile/<nickname>` (DISCOVER-PROFILE, MEMBER-UNAVAILABLE), `/discover/compatibility/<nickname>` (COMPAT, COMPAT-PENDING) |
| Tests | `npm test` (2026-11-18): 39 files, 343 tests; the last completed run passed 342 / 343, and its one failure was this phase's own new `member-profile.test.ts` asserting the pre-Phase-10 line (fixed to the LIKES-aware line; final run 343 / 343). `npm run lint`: clean (240 warnings seen once came from two stray build copies, `.next-mock/` and `.next-api/`, now deleted and git-ignored). `npm run build` (mock): clean on retry (Next's security-vulnerability stop on the first attempt), 151 pages incl. `/likes`. |

**Files changed**
- `src/components/sections/portal/discover/profile-view.tsx`: shared history-first `PortalBack`; main photo 600:660 at every width, `object-top`; "More photos" 600:320 frames in an auto-fill grid, `object-top`
- `src/components/sections/portal/discover/profile-decisions.tsx`: `replaceRoute`; Like / Pass pinned (`layout.stickyActions`) and side by side on phones; from LIKES the decision goes back to LIKES (Phase 10)
- `src/lib/portal/shared-interests.ts`: `sharedInterestLabels` (by id or label); `src/lib/portal/api-members.ts` uses it
- `src/data/portal/discover.ts`: `profilePage.back` removed (unused)
- New tests: `src/lib/portal/shared-interests.test.ts` (4), `src/test/discovery-profile-contract.test.ts` (4), `src/components/sections/portal/discover/member-profile.test.ts` (6)

**Bugs found and fixed**

| # | Bug | Fix |
|---|---|---|
| P9-1 | Back always opened Discover | shared history-first Back (fallback DISCOVER) |
| P9-2 | "More photos" cropped from the bottom | 600:320 frames, centre-top |
| P9-3 | Main photo stretched to the text column from 1024px | 600:660 at every width, centre-top |
| P9-4 | A decision left the profile in history | replace to DISCOVER / LIKES |
| P9-5 | Like / Pass below the fold at 200–400 % | pinned above the tab bar |

### Zoom matrix

Mock production build, emulated zoom (a first attempt was void: another build replaced `.next` mid-run). ✓ = no overflow, nothing outside, no clipping, no bands, no bottom gap, no photo cropped from the bottom, the decisions (profile) or every action (status screens) reachable, no console messages. **77 / 78 passed.**

| Route / state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | 1920 × 1080 50 / 200 / 400 | Rule 3 widths | Desktop windows (rule 60) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DISCOVER-PROFILE | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 6/7 | 3/3 |
| COMPAT | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 7/7 | 3/3 |
| COMPAT-PENDING | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 7/7 | 3/3 |

- The one ✗ is DISCOVER-PROFILE at 1920 × 900 (a rule 3 width, not a rule 60 window): the 1.33 fit puts the main photo's top at 568 px of 900, below the harness's 60 % mark; it passes at 1920 × 1080. The page is long by design (Figma 2174 px): its heading, notification card and description lead.
- Photos: main and more photos `object-cover` at `50% 0%`; no `object-bottom` anywhere.

### Back navigation

| Entry → Profile → Back | Result |
|---|---|
| Discover (same card) / Likes / Compat / conversation / match details | history-first `PortalBack` — PASS (source test); real-browser check from all five handed over |
| Direct entry | fallback DISCOVER |
| After Like / Pass | replace — PASS (source test) |

### API checks
- **Contract (`discovery-profile-contract.test.ts`):** an active profile maps from the API only, shared interests are a subset of the profile's interests; `availability: UNAVAILABLE` (200) and 404 `USER_NOT_FOUND` both give MEMBER-UNAVAILABLE.
- **Live (handed over):** 403 julian_vance viewing a female's profile and compatibility; shared interests checked against both profiles.

**Backend / API blockers:** none.

**Remaining issues**
- The page's "Back" label replaces the drawn "Back to discovery" pill (design-silent).
- Real zoom and the five-entry Back checks are with the browser tester.

---

## Phase 10: Likes received (new heart icon and page)

### Pre-change audit (2026-11-18)

The collection documents `GET /discovery/likes-received?page&limit` (items with `nickname`, `age`, `mainPhotoUrl`, `isVerified`, `isSuperLike`, `distanceKm`, `isLocked`; `mode` `ALL_UNBLURRED` | `PAYWALL_BLURRED`; `meta` page / limit / total / totalPages / hasMore / nextCursor) and `POST …/:nickname/match` (`match` with `conversationId`, `expiresAt`) / `…/pass` (`match: null`). No live call was made from this session (the multi-account check is with the browser tester, who records any "Live API vs the collection" difference). MATCH-NEW (`MatchNewScreen`, Phase 7) is reused for the match confirmation.

### Result

| | |
|---|---|
| Status | **Code done, automated checks done** (2026-11-18). Real-zoom and multi-account API checks with the browser tester. |
| Routes | `/likes` (LIKES: cards, empty, match confirmation, paywall mode); the header heart on every portal page |
| Tests | `npm test` (2026-11-18): 39 files, 343 tests; the last completed run passed 342 / 343, and its one failure was this phase's own new `member-profile.test.ts` asserting the pre-Phase-10 line (fixed to the LIKES-aware line; final run 343 / 343). `npm run lint`: clean (240 warnings seen once came from two stray build copies, `.next-mock/` and `.next-api/`, now deleted and git-ignored). `npm run build` (mock): clean on retry (Next's security-vulnerability stop on the first attempt), 151 pages incl. `/likes`. |

**Files added / changed**
- New: `src/app/likes/[[...view]]/page.tsx`, `src/components/sections/portal/likes/likes-view.tsx`, `src/components/pieces/cards/like-card.tsx`, `src/data/portal/likes.ts`, `src/lib/portal/likes.ts`
- `src/lib/routes.ts` (`LIKES: "/likes"`), `src/lib/portal/views.ts` (area / view `likes`), `src/components/sections/portal/shared/portal-page.tsx`, `src/stores/portal-store.ts` (`getLikesPage`)
- `src/lib/api/endpoints.ts`, `src/lib/api/types/discovery.ts` (`LikeReceivedItem`, `LikesReceivedData`, `LikeDecisionData`), `src/lib/api/modules/discovery-api.ts` (`likesReceived`, `matchLike`, `passLike` with cache refreshes), `src/lib/api/modules/cache-keys.ts`, `src/lib/screen-keys.ts`
- `src/lib/portal/portal-service.ts` (`getLikesReceived`, `matchLike`, `passLike`), `api-portal-service.ts`, `mocks/mock-portal-service.ts` (marked mock: three likes)
- `src/components/pieces/shells/header-menu.tsx` (heart before the bell), `src/components/sections/portal/discover/match-new-screen.tsx` (`keepLabel`), `src/lib/portal/deck-intent.ts` (`likesIntent`), `src/lib/control-sizes.ts` (`icon` button size, `layout.likesGrid`), `src/data/portal/types.ts` (`LikeReceived`, `LikesPage`)
- New tests: `src/test/likes-received.contract.test.ts` (6), `src/lib/portal/likes.test.ts` (7), `src/components/sections/portal/likes/likes-entry.test.ts` (6)
- Docs: `AGENTS.md` (rule 7 folder list, LikeCard and LikesView in the registry, Decisions "Phase 9" and "Phase 10")

### Zoom matrix

Mock production build, emulated zoom, LIKES with three cards, empty, and the match screen after Like. ✓ also means Pass and Like are visible inside every card and clickable, and at 100 % in the desktop windows the first card's buttons are on the first screen. **78 / 78 passed** (after P10-1 below; before it, 1280 × 800 and 1920 × 900 failed with the first card's buttons at 844 px of 800).

| Route / state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | 1920 × 1080 50 / 200 / 400 | Rule 3 widths | Desktop windows (rule 60) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LIKES (3 cards) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 7/7 | 3/3 |
| LIKES empty | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 7/7 | 3/3 |
| LIKES match (MATCH-NEW) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 3/3 | 7/7 | 3/3 |

- Grid: 3 columns in the 1440 frame with three cards (auto-fill 16rem tracks), 1 column at 360 px.
- First card's buttons end at 787 px (1440 × 900), 787 (1280 × 800), 755 (1366 × 768), 1044 (1920 × 1080).
- **P10-1 (fixed):** the 4:5 card photo pushed Pass / Like below the first screen at 1280 × 800; `likePhotoFrame` caps it by the viewport (`max(12rem, var(--svh) − 27rem)`), cropping from the top.

### Back navigation

| Path | Result |
|---|---|
| Heart → Likes → Back | history-first, fallback DISCOVER |
| Likes → profile → Back | Likes, pages kept in the TanStack cache |
| Likes → Like → match → Say hello → conversation → Back | Likes (handed over) |
| Direct entry / refresh of /likes | loads; Back falls back to DISCOVER |

### API checks
- **Contract (`likes-received.contract.test.ts`):** the list maps photo, name, age, km, verified, Super Like and `meta` (page 2 / limit 20 in the query); paywall mode keeps the masked name and blurred photo; a like back returns the match and refreshes likes, matches and conversations; a pass refreshes likes; 409 / 404 count as a gone card, 429 doesn't.
- **Live (handed over):** 302 maliha_t → 402 rohan_sen like and like back (match for both, conversation opens), 303 shreya_b → 401 omar_farooq pass (gone after refresh), 403 julian_vance receiving likes from both genders, paywall mode, paging, network shapes.

**Backend / API blockers:** none known yet (the live check records any difference from the collection).

**Remaining issues**
- No count badge on the heart (it would add a request on every portal page); design-silent.
- All LIKES copy is design-silent (no Figma frame), for owner approval.
- Real zoom and the multi-account checks are with the browser tester.

---

## Phase 11: Matches, outcomes and match details

Method: headless Chrome over CDP, zoom emulated as CSS viewports (`deviceScaleFactor` = zoom); no real-browser tool was connected, so real zoom is handed to the browser tester (`PHASE11_12_TEST_PROMPT.md`). Production build in **API mode** (staging) on port 3001, signed in as 404 tahmid_hasan (10 matches, all with completed dates). The owner's `next dev` on 3000 was stuck on a stale Turbopack error ("Export LikeCard doesn't exist", from an old `profile-decisions.tsx`) and was left alone.

| | |
|---|---|
| Status | **Code done, automated checks done** (2026-11-18). Real-zoom and countdown-parity checks with the browser tester. |
| Routes | `/matches`, `/matches/cancelled`, `/matches/complete`, `/matches/match/<nickname>` |

**Audit (before changes)**
- Grid fixed at `sm:2 / lg:3` columns; card photo a fixed 240px height (`h-60`), cropped centre.
- Outcome tabs read only the first page and **showed nothing on a failed read**; the match detail **stayed blank on a failed read**.
- Complete tab showed "Leave date feedback" on dates already rated (the API refuses a second rating).
- Live: every card read "Say hello and make a plan." (sample copy) although the conversations had messages: `GET /matches` sends `lastMessagePreview: null` (blocker X10).
- Sending / receiving a message never invalidated the matches cache, so previews stayed stale.
- At 1440×900 the first card ended at 924px and the detail's "Plan a date" at 933px (rule 60 fail).
- Already fine: countdown not a live region (`live={false}`), `expiresAt: null` → "Active match" without a timer, server-time correction, history-first Back (Phase 1), tabs are URLs.

**Fixed**
1. Grid `layout.matchesGrid` (auto-fill, 240px minimum); cards `min-w-0`, names / previews wrap (`break-anywhere`, preview 2 lines).
2. Card photo 4:5 centre-top capped by `matchPhotoFrame` (7rem floor); outcome photos centre-top; detail venue image as the Figma 860×260 ratio capped by the viewport.
3. Outcome tabs: cursor paging (`getOutcomes(tab, cursor)` → `{ outcomes, next }`, TanStack infinite query, "Show more"), load-failed state; detail load-failed state.
4. Rated dates: only "View completed date" (`MatchOutcome.rated` from `latestDate.myRatingDone`).
5. Card previews from the cached `GET /conversations` list (one request); a confirmed match without a message shows no line; `chatApi.send`, the inbox socket refresh and incoming messages invalidate `cacheKeys.matches`.
6. Detail actions pinned above the tab bar below 1024px (`layout.stickyActions`); urgent badge `live={false}`.

**Files:** `lib/control-sizes.ts`, `pieces/cards/match-card.tsx`, `pieces/cards/outcome-card.tsx`, `sections/portal/matches/matches-view.tsx`, `match-detail-view.tsx`, `data/portal/matches.ts`, `lib/api/modules/matches-api.ts`, `lib/api/modules/chat-api.ts`, `lib/portal/portal-service.ts`, `api-portal-service.ts`, `mocks/mock-portal-service.ts`, `api-chat-service.ts`; tests `lib/portal/server-clock.test.ts`, `test/matches.contract.test.ts`.

**First screen (rule 60), 100 %, after:** first card bottom / detail "Plan a date" bottom — 1440×900: 892 / 870 ✓; 1280×800: 792 / 770 ✓; 1366×768: 792 (24px past the fold: three stacked 56px actions don't fit 768 with a photo) / 754 ✓; 1920×1080: 1068 / 1038 ✓. Screenshot at 1440×900 checked: four cards, real previews, aligned edges.

**Zoom matrix (1440 window, after; API data, 10 cards)**

| Zoom | CSS vp | `/matches` cols | overflow | `/matches/complete` | detail primary |
|---|---|---|---|---|---|
| 50 | 2880×1800 | 4 (scaled ×2) | none | 1 col, photo 480 | visible |
| 75 | 1920×1200 | 4 | none | ✓ | visible |
| 90 | 1600×1000 | 4 | none | ✓ | visible |
| 100 | 1440×900 | 4 | none | ✓ | visible (870) |
| 110 | 1309×818 | 4 | none | ✓ | visible |
| 125 | 1152×720 | 4 | none | ✓ | scroll (≥1024, not sticky) |
| 150 | 960×600 | 3 | none | ✓ | pinned |
| 175 | 823×514 | 2 | none | ✓ | pinned |
| 200 | 720×450 | 2 | none | ✓ | pinned |
| 250 | 576×360 | 2 | none | ✓ | pinned |
| 300 | 480×300 | 1 | none | ✓ | pinned |
| 350 | 411×257 | 1 | none | ✓ | pinned |
| 400 | 360×225 | 1 | none | ✓ (photo 264) | pinned |

Tabs stay on one row at every level (`max-sm:flex-1`). No horizontal overflow and no element past the right edge anywhere. Zooming out keeps four columns and scales them (rule 59) rather than adding a fifth.

**Back (client-side clicks, real trail)**

| Path | Result |
|---|---|
| `/matches` → View match details → Back | `/matches` PASS |
| `/matches` → Open chat → Back (400 %) | `/matches` PASS |
| detail → Open conversation → Back (400 %) | detail PASS |
| detail direct entry → Back | fallback `/matches` (data, unchanged) |

**Tests:** `server-clock.test.ts` 5/5, `matches.contract.test.ts` 7/7.

**Remaining:** countdown parity across two accounts needs an open match with a running clock (none in the seed data, X11). "View date" on a completed match opens DATE-PENDING (Phase 17). The Discover preferences card beside the detail shows an empty "Location" for tahmid_hasan (X12) and the sample defaults while loading (shared Phase 7 piece, not changed here).

## Phase 12: Messaging A: inbox and the three-panel layout

Method as Phase 11 (API mode, 404 tahmid_hasan, conversation with sadia_rahman: 6 messages).

| | |
|---|---|
| Status | **Code done, automated checks done** (2026-11-18). Real zoom and the two-account live-row check with the browser tester. |
| Routes | `/chats`, `/chats/<nickname>` (layout) |

**Owner report, measured before changes (pane / message list / messages fully visible):** 1440×900: 748 / **386** / 4; 1309×818: 666 / 304 / 3; 1152×720: 584 / 222 / 2. Around the list: header 50, tools row 56, composer 86 (label + 56 input), action row 56, 24px padding, 16px gaps. Figma W05 CHAT-01 draws the same (400px list in a 760px pane); type matched Figma (16px messages, 20px name), so the space went to chrome, not type.

**Fixed**
1. Tools moved into the conversation header as 44px pills (wrap under the name when narrow); composer label screen-reader only (`FormField hideLabel`); pane padding 20, gaps 12, list padding 12, bubble padding 12/16.
2. Columns: xl `clamp(240px,20%,320px) | 1fr | clamp(260px,22%,360px)`, lg `clamp(240px,24%,320px) | 1fr`.
3. Context reachable at every width: below 1280 a member button in the header opens "Your connection" in `PortalDialog` (was hidden 768–1279 with no way to open it).
4. Back above the conversation on single-pane widths (history-first, fallback INBOX).
5. Pane floor 420 → 360px.
6. INBOX and the side list ordered by the newest message on the client (`lib/portal/conversation-list.ts`).

**After (pane / list / visible):** 1440×900: 748 / **508** / 6 ✓ (owner target 6–8); 1309×818: 666 / 426 / 4–5; 1152×720: 584 / 344 / 4.

**Zoom matrix, `/chats/sadia_rahman` (composer + Send position, CSS px)**

| Zoom | CSS vp | overflow | Send top–bottom | visible | layout |
|---|---|---|---|---|---|
| 50 | 2880×1800 | none | 1446–1558 | ✓ | 3 columns ×2, no bottom gap |
| 75 | 1920×1200 | none | 964–1039 | ✓ | 3 columns |
| 90 | 1600×1000 | none | 803–866 | ✓ | 3 columns |
| 100 | 1440×900 | none | 723–779 | ✓ | 3 columns |
| 110 | 1309×818 | none | 641–697 | ✓ | 3 columns |
| 125 | 1152×720 | none | 551–607 | ✓ | list + chat, context in dialog |
| 150 | 960×600 | none | 532–588 | ✓ | single pane, Back |
| 175 | 823×514 | none | 446–502 | ✓ | single pane |
| 200 | 720×450 | none | 382–438 | ✓ | single pane |
| 250 | 576×360 | none | 254–310 | ✓ | phone, tab bar |
| 300 | 480×300 | none | 194–250 | ✓ | phone |
| 350 | 411×257 | none | 151–207 | ✓ | phone |
| 400 | 360×225 | none | 131–187 | ✓ | phone, composer above the tab bar |

`/chats` (INBOX) at 100 % and 400 %: no overflow, rows truncate names (`min-w-0 truncate`) and previews (2 lines).

**Back:** `/chats/sadia_rahman` direct entry → Back = `/chats` PASS; `/chats` → row → Back = `/chats` PASS; `/matches` → Open chat → Back = `/matches` PASS.

**Tests:** `lib/portal/conversation-list.test.ts` 6/6, `test/conversations.contract.test.ts` 3/3.

**Not done / remaining:** live row update with two accounts (F sends to 404 while on `/chats`) handed to the browser tester. Conversations list reads one page of 50 without "Show more" (open matches are few); add cursor paging if the API ever returns more. Closed (read-only) conversations still list, so their history stays readable; the inbox drops only blocked ones.

**Full run (2026-11-18, after both phases):** `npm test` 43 files / 365 tests passed (4 new files, 21 new tests; no existing test changed); `npm run lint` clean; `tsc --noEmit` clean; `next build` compiled with no warnings, then stopped on Next.js's security-upgrade notice (`SecurityFatalError`, the known 16.4.3 advisory; the output was complete and served).

## Phases 7–14: status check (2026-11-18)

The owner's tester (Antigravity) ran the browser checks for phases 7–14. Before marking them, the code was checked against each phase's deliverables:

| Phase | Deliverables found in the code | Status |
|---|---|---|
| 7–10 | Sections above; `deck-intent`, `preference-facts`, `shared-interests`, `likes` with tests | **Done** |
| 11 | Matches grid / paging / previews (Phase 11 section) | **Done** |
| 12 | Three-panel chat, context dialog, conversation order (Phase 12 section) | **Done** |
| 13 | `pieces/overlays/action-menu.tsx` + `action-menu.logic.ts` (+ test), `lib/portal/chat-optimistic.ts` (one bubble per message, + test), `chat-bubble-layout.ts` (+ test), bubbles on `MediaFrame` with tap-to-reveal time, the six-item "+" menu with icons | **Done.** One deviation: Voice uses `music-note-01`, since no `mic` glyph was exported |
| 14 | `more-vertical` icon, `lib/portal/conversation-menu.ts` (+ test), block / unblock dialogs in `chat-view.tsx`, `/blocks` covered in `api-contract.test.ts` | **Done.** Unmatch is `notFunctional` (X1) |

Whole suite at this point: 47 files / 383 tests passed. One first run had a single failure in the Google sign-in contract test that didn't happen again (a timing flake; noted, not changed).

## Phases 15–18: date planning (venues, area, time, review, plan states, attendance, feedback)

| | |
|---|---|
| Status | **Code done, unit tests done** (2026-11-18). The zoom matrix, Back walk-throughs and two-account checks are handed to the browser tester: `PHASE15_18_TEST_PROMPT.md`. |
| Routes | `/dates/venues/<n>` (VENUES, VENUES-EMPTY, the new VENUES-AREA dialog), `/dates/place/<n>`, `/dates/time/<n>`, `/dates/review/<n>`, `/dates/plan/<n>` (all plan and attendance states), `/dates/manage/<n>`, `/dates/feedback/<n>`, `/dates/complete/<n>` |

**Audit (before changes)**
- **N2:** both "Change area" actions opened `/onboarding/location`, the onboarding step that `PATCH`es the profile location.
- The VENUES map was a fixed `h-123` (492px) / `h-90`. The list column was taller than the first screen at 1440×900.
- The place card kept a 112px photo beside the text at 360px (text column under 130px).
- Direct entry to `/dates/place/<n>` with no chosen place rendered an empty page. `/dates/review/<n>` checked only for a date and time, not for a place.
- The date picker allowed any future day, and the time list allowed times under an hour away. The API takes dates 1 hour to 14 days ahead, so the only error the user saw came after Send.
- Send, Cancel and Skip feedback used `router.push`, so Back could reopen a review that had already been sent, or the cancel screen. The mock's returned plan wasn't put in the cache, so the next screen could read a stale plan.
- DATE-CONFIRMED / plan screens: the member row came first, and the place was only a "Where" row.
- **N3:** ATTENDANCE showed only the question (h1 "Did you meet…?"), without the date details. ATTENDANCE-WAIT and ATTENDANCE-REVIEW didn't show the details either.

**Fixed**
1. **Date-specific area (rule 55).** "Change area" opens **VENUES-AREA**, a `PortalDialog` client state on the VENUES URL (`sections/portal/dates/area-dialog.tsx`). It offers:
   - "Use my current location", asked only from the click and rounded to 0.01°, or named after the nearest starter area;
   - an area search over the starter list (`dateService.searchAreas`, which reuses `lib/onboarding/area-search.ts`);
   - "Use the area around both of you", which clears the area.

   `dateService.setPlanArea` saves `{ label, lat, lng }` in the plan draft only (`48date.dates.drafts` with the API, `48date.mock.dates` with the mock). The draft is validated on read and kept after the plan is sent. VENUES shows "Area: {label}". DateSummary shows an "Area" row on review, plan, manage, complete and attendance.
2. **Venue ranking by area.** The API takes no location (X2). Suggestions are requested as before, from one cached run per match. Then they are ranked by haversine distance from the area centre and filtered to 15 km. Each card says "{x} km from {area}". With nothing in range, VENUES-EMPTY says "No suggested public places are within 15 km of {area}." The mock's sample places sit in San Francisco, so a Dhaka area shows the empty state.
3. **Dhaka neighbourhoods** added to the starter area list (Gulshan, Banani, Baridhara, Bashundhara, Uttara, Mirpur, Mohakhali, Dhanmondi, Lalmatia, Mohammadpur). All test accounts live there, and the list only had "Dhaka". The list is shared with onboarding LOCATION and SETTINGS-LOCATION, which can now offer these too.
4. **Map and list layout.** The map is the Figma 672:492 ratio, capped by the viewport (`venueMapFrame`). From 1024px the list scrolls inside the same height (`venueListFrame`). Pins are positioned in %.
5. **Place card.** A container query keeps the 112×128 photo beside the text only when the text column keeps at least 160px; otherwise the photo stacks on top at 16:9. The place detail hero uses the Figma 860:260 ratio.
6. **Direct entry.** `/dates/place/<n>` with no place, and `/dates/review/<n>` with no place, date or time, now open the missing step with `replaceRoute`.
7. **Date window.** `DatePicker` takes `max` (today + 14). TIME-PICKER lists only slots 1 hour to 14 days ahead in the plan's timezone (`dateWindowError` in `lib/portal/date-format.ts`), with a "No times are left on this day" note when none are left. Submit shows "at least an hour from now" or "within the next 14 days". The API's own 4xx reason still shows through `failureReason`.
8. **Navigating away after a finished step.** Send invitation, Cancel date and Skip feedback put the returned plan in the cache, then use `replaceRoute`, so Back can't reopen the finished step.
9. **Details first (requirement 7.4).** `DateSummary` is now a details card: the place as an h2, then When, Timezone, Area and Meeting place (plus Weather on review). The partner row comes after it. This applies to review, pending, received, confirmed, manage, complete and every after-date state.
10. **Attendance (N3).**
    - The page h1 is "Your date with {name}".
    - The details card comes first, then a secondary "Have you met?" section (h2, 14px scale).
    - The two radios now drive one primary button: "We met" records attendance, "We didn't meet" opens NO-SHOW.
    - ATTENDANCE-WAIT and ATTENDANCE-REVIEW show the details first too, then their summary and actions.
    - The order comes from `attendanceSections()` and is unit-tested.
11. The plan-state mapping (`statusOf`, `attendanceOf`) moved out of the API service into `lib/portal/date-plan-state.ts`, with `planScreen()` for PlanView's branching. Its behaviour is unchanged and covered by the existing contract tests.

**Checked and unchanged:**
- Back is already history-first everywhere through `PortalBack`. Its fallbacks are: VENUES → conversation, PLACE → VENUES, TIME → PLACE, REVIEW → TIME, plan → conversation, manage → plan, feedback → plan, complete → MATCHES-COMPLETE.
- Live plan updates come through `dateService.watch` (socket `date:*`). The mock still polls a pending plan every 2s, as before (mock only).
- Weather on review, and one open plan per match (withdraw or decline before the new invitation).

**Files:**
- `data/portal/dates.ts`, `data/onboarding/location.ts`;
- `lib/portal/date-area.ts` (new), `date-plan-state.ts` (new), `date-format.ts`, `date-service.ts`, `api-date-service.ts`, `mocks/mock-date-service.ts`;
- `lib/onboarding/area-search.ts` (exports `distanceKm`), `lib/control-sizes.ts`, `lib/screen-keys.ts`;
- `pieces/cards/place-card.tsx`, `pieces/forms/date-picker.tsx`;
- `sections/portal/dates/area-dialog.tsx` (new), `venues-view.tsx`, `place-view.tsx`, `time-view.tsx`, `review-view.tsx`, `plan-view.tsx`, `manage-view.tsx`, `feedback-view.tsx`, `date-summary.tsx`.

**New tests (all pass):**

| File | Tests | Covers |
|---|---|---|
| `lib/portal/date-area.test.ts` | 9 | Ranking, radius, validation, device naming; the guard that the dates data never links LOCATION / SETTINGS-LOCATION and the date screens never call `saveLocation` / `accountService` / `onboardingService`; the API service stores the area in the draft, re-ranks without a second suggestions run, never `PATCH`es, and drops a tampered draft |
| `lib/portal/date-format.test.ts` | 4 | `scheduledAt` incl. the London DST change; the 1 h / 14 d window; the plan's timezone |
| `lib/portal/date-plan-state.test.ts` | 5 | Every API status, incl. CANCELLED + DECLINED; expiry; attendance |
| `lib/portal/attendance.test.ts` | 2 | Section order; a skipped feedback sends no rating |

The confirm, rating, venue-run and plan contracts were already covered in `test/api-contract.test.ts` (the "live API shapes" and "dates" blocks), so no new contract file was needed.

**Full run (2026-11-18):** `npm test` 51 files / 403 tests passed (20 new tests; no existing test changed). `npm run lint` and `tsc --noEmit` clean. `next build`: the first run stopped on Next.js's security-upgrade notice; the retry compiled with no warnings, exit 0.

**Not run here (handed to the tester, `PHASE15_18_TEST_PROMPT.md`):**
- the 13-level zoom matrix and the rule 3 widths on every date route and dialog;
- the 1440×900 first-screen screenshots;
- the Back walk-throughs;
- M1 ↔ F5 area / invitation / accept / postpone live checks, and the `GET /users/me` location before / after proof.

**Backend / API blockers:**
- X1 (Unmatch).
- X2 (venue suggestions take no area; asked for `{ latitude, longitude, radiusKm }` or `{ areaLabel }` on `POST /matches/:id/venue-suggestions`).
- X8 (ATTENDANCE needs a date that is SET and past, or AWAITING_CONFIRMATION; the seed's dates are COMPLETED, so they show DATE-COMPLETE / FEEDBACK-DONE only).

**Remaining / design-silent (for owner approval):**
- The area dialog copy and the 15 km radius.
- One primary attendance button driven by the radios (Figma drew two buttons).
- The details card heading uses the 20px card scale.
- No "open in maps" link: it would be an external link, and none exists in data.

**Right-side blank band (owner report, 2026-11-18):**
- In the screenshot the page's own scrollbar sits about 1440px from the left inside a 1920px Chrome window marked "controlled by automated test software".
- A page can't draw past its own scrollbar, so the page viewport was about 1440px wide. That points to the test tool's leftover viewport emulation (`Emulation.setDeviceMetricsOverride`), not a CSS gap.
- The fix on the tester's side: clear the override, or use a fresh window. This is step 0 of `PHASE15_18_TEST_PROMPT.md`.
- **Checked:** the production build, rendered headless at a 1904px viewport, fills the full width on `/signin` (auth frame, `fit-portal` scale) and `/terms` (`fit-landing`). Headers reach the right edge and the scrollbar sits at the true edge, with no band. The signed-in portal wasn't rendered here; it uses the same body zoom-fit.
- If the band still shows in a fresh normal Chrome window at 100 %, report it with the window size, and it gets fixed in CSS.

## Phases 7–18: status re-check (2026-11-18, second pass)

- The owner reports that the tester (Antigravity) browser-tested phases 15–18.
- Since the last pass, no code in scope changed. The tester didn't append results to this report, and `PHASE15_18_TEST_PROMPT.md` has been removed from the repo.
- Phases 7–18 are **Done**. For phases 15–18 the browser matrix figures aren't recorded here; they stay with the tester.

## Phases 19–21: games, stories feed, story details

| | |
|---|---|
| Status | **Code done, unit and contract tests done** (2026-11-18). The zoom matrix, Back walk-throughs and two-account checks are handed to the browser tester: `PHASE19_21_TEST_PROMPT.md`. |
| Routes | `/games/<n>` (GAMES, GAME-QUESTION, GAME-WAIT, GAME-RESULT, GAME-LEFT, GAME-LEAVE), `/stories`, `/stories/story/<id>` (STORY-DETAIL, COMMENT-SENT, the consent view, the new unavailable state); STORY-MINE shares the story body |

**Audit (before changes)**
- Games:
  - GAMES (the intro) had no Back control.
  - The art box was a fixed `h-129` / `h-70`.
  - The picture choice was a fixed 169×120px.
  - The choices sat in a fixed `sm:grid-cols-2` grid.
  - Next / Continue wasn't pinned at short heights.
  - The data Back fallback is INBOX, but the view already overrides it with the member's conversation.
- **Stories feed:**
  - Photos were cropped (`object-cover`, fixed `h-75` / `h-56`).
  - Only the first 20 stories were read, with no "Show more", loading, empty or error state.
  - "Share your story" was only at the bottom of the column, and in the aside that is hidden from 768 to 1279 (**N7**).
- **Story detail:**
  - The photo was cropped to 350px (**N6**).
  - An unknown or unpublished id rendered a blank page.
  - A failed comment post threw and left the button stuck on "Posting…".
  - Comments couldn't be paged or deleted.
  - **Like could never be undone:** `toggleLike` always sent `POST /like`. The API unlikes with `DELETE /like`, and its response names the count `likeCount`, not `likesCount`.

**Fixed**
1. **Games.**
   - Back on every game state is history-first, with the member's conversation as the fallback. During a question or wait it still opens GAME-LEAVE.
   - The art is the 856:515 ratio, capped by the viewport (`gameArtFrame`).
   - Choices use `layout.choicesGrid` (`repeat(auto-fit, minmax(min(100%, 10rem), 1fr))`), so they stack when narrow. The picture is `aspect-[169/120]` up to 169px, cover.
   - The question / wait action row is pinned above the tab bar below 1024px (`layout.stickyActions`).
   - The resume / count / gating logic moved into `lib/portal/game-progress.ts`. Its behaviour is unchanged: ten rounds, resume at the first unanswered question, nothing revealed before GAME-RESULT.
2. **Feed.**
   - Cursor paging: `storyService.getStoryPage`, an infinite query, "Show more stories".
   - Load-failed and empty states.
   - Cards in `layout.storiesGrid` (auto-fill 20rem columns, `items-start`).
   - Photos through `MediaFrame` at their own ratio, capped by the `card` height (9:16 never makes a giant card).
   - "Share your story" and "My shared story" sit in the header below 1280px (`xl:hidden`). From 1280 the aside carries them, so they aren't duplicated. The bottom duplicate was removed.
3. **Story detail.**
   - The photo is shown through `MediaFrame` (its own ratio, measured on load, `story` height cap). This also applies to STORY-MINE.
   - An unknown id shows "This story isn't available" with "Back to stories".
   - Load errors show `LoadFailed`.
   - Comments are paged (`getComments`, "Show earlier comments", no duplicates across pages). The member's own comments show as "You" with Delete behind a confirmation dialog (`DELETE /success-stories/:id/comments/:commentId`).
   - A failed post keeps the text and shows the reason.
   - Like / unlike sends POST or DELETE by the current state and shows the server's count. A failure shows a note.
4. Media height tokens: `story` 45 % of the viewport (max 28rem) and `card` 36 % (max 20rem), for the first-screen fit (rule 60). Neither was used anywhere before.

**Files:**
- `data/portal/stories.ts`;
- `lib/api/modules/stories-api.ts` (paged feed and comments, `unlike`, `deleteComment`), `lib/portal/story-service.ts`, `api-story-service.ts`, `mocks/mock-story-service.ts`, `lib/portal/story-comments.ts` (new), `lib/portal/game-progress.ts` (new);
- `lib/media/aspect.ts` (`frameStyle`), `lib/control-sizes.ts`;
- `pieces/media/media-frame.tsx`, `pieces/forms/picture-choice.tsx`;
- `sections/portal/games/game-view.tsx`, `sections/portal/stories/stories-view.tsx`, `story-view.tsx`, `story-body.tsx`.

**New tests (all pass):**

| File | Tests | Covers |
|---|---|---|
| `lib/portal/game-progress.test.ts` | 5 | Resume index; the result count; Next gated on the partner's answer |
| `lib/portal/story-image.test.ts` | 9 | 16:9 / 9:16 / 4:3 / 3:4 / 1:1 / 21:9 at their own ratio; 1:3 letterboxed in 9:21; the 4:3 placeholder; the height cap narrows the width by the same ratio |
| `lib/portal/story-comments.test.ts` | 2 | Pages merged without duplicates; removal after delete |
| `test/stories.contract.test.ts` | 5 | Feed cursor; like POST / unlike DELETE (`likeCount`); comments paged with own comments marked; post; delete |

Games endpoints were already covered in `api-contract.test.ts`.

**Full run:** `npm test` 55 files / 424 tests passed (21 new tests; no existing test changed). `npm run lint` and `tsc --noEmit` clean. `next build` compiled with no warnings (exit 0).

**Backend / API blockers:**
- X3: story photos have no width / height, so the frame shows 4:3 until the photo loads.
- The unlike response names the count `likeCount`, while the like response says `likesCount`. Both are read; the backend should use one name.

**Remaining / design-silent (for owner approval):**
- The feed / comment / unavailable / delete copy.
- Delete shown only on the member's own comments. "Own" is matched by nickname against `/users/me`, since comments have no author id or `isMine` flag; the backend could add `isMine`.
- The feed has no like button; the like toggle stays on the detail page, as drawn.

## Phase section template (copy for each phase)

```
## Phase N: <name>
- Status: Done | Partially done | Blocked
- Date:
- Routes completed:
- Files changed:
- Bugs found:
- Bugs fixed:
- New tests added:
- Tests executed: npm test → X files, Y tests: P passed, F failed · lint: … · build: …
- Zoom matrix (50/75/90/100/110/125/150/175/200/250/300/350/400 % at 1440×900; method: real zoom | emulated):
  | Route/state | 50 | 75 | 90 | 100 | 110 | 125 | 150 | 175 | 200 | 250 | 300 | 350 | 400 | Notes |
- Back-navigation checks (path → expected → result, incl. direct entry and refresh):
- Image checks (component, ratios tested, result):
- Multi-account checks (accounts, steps, result; no OTPs or tokens):
- Backend/API blockers:
- Remaining issues:
```
