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
| 3 | Legal pages | P3 | Not started |
| 4 | Authentication | P1 | Not started |
| 5 | Onboarding A (steps 1–11) | P2 | Not started |
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
| Tests | `npm test`: **11 files, 158 tests, 158 passed, 0 failed** (the 107 earlier tests unchanged, plus 51 new) · `npm run lint`: clean · `npm run build`: compiled, no warnings |

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

PORTAL_MATRIX_PLACEHOLDER

**Back navigation (browser history; the landing page has no in-page Back, as in Figma)**

| Check | Result |
|---|---|
| `/` (scrolled to 600) → "How it works" (section link) → browser Back | PASS: `/` at scroll 600 |
| `/` (scrolled to 2400) → Get started → `/signup` → browser Back | PASS: `/` at scroll 2400 |
| Direct entry `/how-it-works` at 1440×900 and 360×225 | PASS: section top at 48 px |
| Refresh on `/how-it-works` | PASS: section top at 48 px |

**Functional**
- FAQ: several answers can be open at once (first + two more opened: `true,true,true,false,false`); toggled from the keyboard.
- Nav menu at 400 %: focusable and opens from the keyboard. It lists How it works, Features, Safety, Membership, Log in and Get started. The menu runs past the 225 px viewport (top 102 px, bottom 340 px) and scrolls with the page, so every item stays reachable.
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
