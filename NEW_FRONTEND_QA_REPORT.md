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
| 6 | Onboarding B (photos, verification, notifications, ready) | P2 | Not started |
| 7 | Discover deck and match moment | P1 | Not started |
| 8 | Discovery filters | P2 | Not started |
| 9 | Member profile and compatibility | P2 | Not started |
| 10 | Likes Received (new) | P1 | Not started |
| 11 | Matches, outcomes and match details | P1 | Not started |
| 12 | Messaging A: inbox and three-panel layout | P1 | Not started |
| 13 | Messaging B: conversation, bubbles, composer, "+" menu | P1 | Not started |
| 14 | Messaging C: conversation menu (unmatch, block, report) | P1 | Not started |
| 15 | Date venues, place details, date-specific area | P1 | Not started |
| 16 | Date time, review, invitation | P1 | Not started |
| 17 | Date plan states and manage | P1 | Not started |
| 18 | Accepted date details, attendance, feedback, completion | P1 | Not started |
| 19 | Games | P2 | Not started |
| 20 | Stories feed | P1 | Not started |
| 21 | Story details, comments, likes | P2 | Not started |
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
