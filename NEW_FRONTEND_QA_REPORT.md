# 48Date User Web — QA & System Report

---

# Part 1: Frontend Related (Key Pages & Modules)

### 1. Global Shell & Navigation
- **Routes / Components:** Portal Layout, Header (`/chats`, `/discover`, `/matches`, `/stories`, `/profile`, `/settings`), Mobile Bottom Tab Bar, Route Guards (`SessionGate`, `SetupGate`).
- **Issues & Bugs:**
  - White blank band appeared on the right edge during zoom testing.
  - Interactive elements and bottom actions were hidden under the mobile fixed tab bar.
  - Unauthenticated visitors experienced momentary portal content flashing before redirecting.
  - Browser Back button after sign-out or session expiration looped back into protected portal views.
- **How Resolved:**
  - Cleared residual DevTools CDP device metrics overrides; aligned header, main column, and footer to fluid containers (`minmax(0, 1fr)`).
  - Implemented safe viewport padding (`pb-24 lg:pb-8`) and `layout.stickyActions` to keep primary buttons above mobile bars.
  - Extracted pure decision layer in `guards.ts` (`decideSessionGate`, `decideSetupGate`) that renders `null` until authentication state resolves.
  - Replaced router push with `replaceRoute` on auth/setup gates so Back cannot re-enter protected routes.
- **Status:** **Resolved**

---

### 2. Landing & Legal Pages
- **Routes / Components:** `/`, `/how-it-works`, `/terms/*`, `/privacy/*`.
- **Issues & Bugs:**
  - Hero quote card broke out into gutters at 1280px screen width.
  - Legal reading lines stretched across wide screens (>1920px), impairing readability.
  - Top navigation bar covered headlines on extreme zoom (300%–400% / short viewports).
- **How Resolved:**
  - Anchored hero quote card relative to design collage geometry (`right-[4.81%]`) with minimum width restraints.
  - Applied fluid typography (`fit-landing`, `fit-portal`) and reading measures (`--container-measure: 75ch`).
  - Reduced glass navbar height dynamically on short viewports so page titles remain visible on first screen.
- **Status:** **Resolved**

---

### 3. Authentication & Entry
- **Routes / Components:** `/signin/*`, `/signup/*`, Phone Entry, OTP Verification, Google Callback, Session Ended.
- **Issues & Bugs:**
  - Two-column split layout distorted on viewport zoom.
  - Continue / Verify buttons were pushed below the fold on mobile screens and zoom >200%.
  - Phone number was lost on step refresh or accidental navigation.
  - Resend OTP spam allowed rapid repeated requests.
- **How Resolved:**
  - Unified photo-form layout scaling (`fit-portal`) maintaining exact 648:696 split; stacked cleanly on `<1024px`.
  - Implemented `usePrimaryInView` to auto-focus and scroll the primary input and CTA into view on short screens.
  - Stored temporary phone draft in `sessionStorage` (never in URL).
  - Added request cooldown lockout disabling resend action while in-flight or cooling down.
- **Status:** **Resolved**

---

### 4. Onboarding & Verification
- **Routes / Components:** `/onboarding/*` (Steps 1–11), Photo Upload, Selfie Verification (`/onboarding/verification`), Notifications (`/onboarding/ready`).
- **Issues & Bugs:**
  - Going Back discarded entered profile answers.
  - Browser camera remained active in the background when navigating away from selfie verification.
  - Memory leaks from unrevoked image object URLs.
  - Step navigation was hard-coded in individual components.
- **How Resolved:**
  - Centralized draft state in `profileDraft` (`sessionStorage`) saving answers on change; Back never discards data.
  - Explicitly stopped all camera media stream tracks on component unmount or step transition.
  - Revoked all object URLs via `photoStore` when photos are replaced, submitted, or discarded.
  - Configured step sequence centrally in `data/onboarding/flow.ts` (`SetupShell` + `SetupStep`).
- **Status:** **Resolved**

---

### 5. Discovery Deck & Filters
- **Routes / Components:** `/discover`, `/discover/filters`, `/discover/profile/*`.
- **Issues & Bugs:**
  - Action buttons (Pass / Like / Super Like) clipped on short viewports (<450px height).
  - Deck cards experienced horizontal overflow at 400% zoom.
  - Saving filters and clicking Back reopened the filter modal instead of returning to Discovery.
  - Profile images cropped out user faces.
- **How Resolved:**
  - Pinned deck action row using container queries and `layout.stickyActions`.
  - Applied fluid card dimensions with `minmax(0, 1fr)` and responsive gutters.
  - Navigated filter saves with `replaceRoute(router, hrefFor("DISCOVER"))`.
  - Enforced `object-cover object-top` with fixed portrait ratios (4:5 / 3:4).
- **Status:** **Resolved**

---

### 6. Likes Received
- **Routes / Components:** `/likes`.
- **Issues & Bugs:**
  - Header heart badge count did not update live when likes were viewed or acted upon.
  - Member cards created large grey empty bands on ultra-wide screens (50%–75% zoom).
- **How Resolved:**
  - Bound badge to TanStack Query `screenKeys.likesReceived`; invalidated query on like/pass actions.
  - Configured responsive grid with `repeat(auto-fill, minmax(min(100%, 280px), 1fr))`.
- **Status:** **Resolved**

---

### 7. Matches & Match Details
- **Routes / Components:** `/matches`, `/matches/cancelled`, `/matches/complete`, `/matches/match/*`.
- **Issues & Bugs:**
  - Match cards displayed sample placeholder copy ("Say hello and make a plan") despite active messages existing.
  - Match countdown timers triggered screen reader live-region noise.
  - Fixed 240px image heights distorted on narrow mobile screens.
- **How Resolved:**
  - Integrated client-side preview fallback fetching latest conversation message previews.
  - Set `live={false}` on `StatusBadge` countdowns to prevent accessibility spam.
  - Replaced fixed photo dimensions with fluid aspect ratios via `MediaFrame`.
- **Status:** **Resolved**

---

### 8. Messaging & Conversation
- **Routes / Components:** `/chats`, `/chats/*`, Conversation Context, "+ Action Menu", Games Launcher.
- **Issues & Bugs:**
  - Three-panel layout squashed messages on tablets (768px–1024px).
  - Composer input and Send button were hidden behind the mobile keyboard/viewport edge.
  - Block and Report actions in conversation menu required smooth navigation and state cleanup.
  - User-uploaded chat photos stretched when aspect ratios were unknown.
- **How Resolved:**
  - Responsive collapse: tablets and mobile show single panel (inbox or active conversation) with history-first Back button.
  - Sticky composer pinned to bottom with `layout.stickyActions` ensuring visibility down to 360×225.
  - Integrated `ActionMenu` with `chatService` for blocking/reporting and replaced routes cleanly to `/chats`.
  - Displayed chat media via `MediaFrame` calculating dimensions dynamically without cropping.
- **Status:** **Resolved**

---

### 9. Date Planning (Venues, Time & Review)
- **Routes / Components:** `/dates/venues/*`, `/dates/place/*`, `/dates/time/*`, `/dates/review/*`.
- **Issues & Bugs:**
  - Changing the date area modified the user's permanent profile location (`PATCH /users/me/location`).
  - Date and time pickers were unusable on 360×225 screens.
  - Sending an invitation allowed browser Back to re-open the sent review form.
  - Date window allowed selecting invalid past times or days >14 days ahead.
- **How Resolved:**
  - Isolated date area selection strictly within local date draft state; never calls user location API.
  - Styled date/time picker modals with internal scrolling (`max-h-[calc(100dvh-32px)]`) and pinned confirm actions.
  - Navigated invitation submission with `replaceRoute` directly to `/dates/plan/*`.
  - Added frontend validation disabling dates beyond 14 days and times within 1 hour of present.
- **Status:** **Resolved**

---

### 10. Date Plan States, Attendance & Feedback
- **Routes / Components:** `/dates/plan/*` (Pending, Confirmed, Cancelled), `/dates/feedback/*`, `/dates/complete/*`.
- **Issues & Bugs:**
  - Confirmed date view showed action buttons first instead of venue/time details.
  - Partner accepting or postponing an invitation required manual page reloads to see the change.
  - Submitting feedback allowed Back button to return to the feedback form.
- **How Resolved:**
  - Reordered layout hierarchy: Date Summary Card is strictly placed as the primary first element.
  - Integrated live Socket.IO listener (`date:*` events) updating TanStack Query cache automatically.
  - Replaced route history upon feedback submission to `/dates/complete/*`.
- **Status:** **Resolved**

---

### 11. Icebreaker Games
- **Routes / Components:** `/games/*`.
- **Issues & Bugs:**
  - Leaving a game mid-question left the user trapped in game flow.
  - Game answer cards overflowed horizontally on mobile screens.
- **How Resolved:**
  - Added history-aware exit modal (`GAME-LEAVE`) routing back to the originating chat.
  - Styled question and answer cards with fluid flex wrapping and touch-friendly targets.
- **Status:** **Resolved**

---

### 12. Success Stories & Partner Consent
- **Routes / Components:** `/stories`, `/stories/story/*`, `/stories/new`, `/stories/mine`.
- **Issues & Bugs:**
  - Stories feed displayed broken layouts when uploaded photos had varying ratios (16:9, 9:16, 4:3, 1:1).
  - Story draft was discarded if network error occurred during submission.
  - Partner approving or declining consent caused history loops.
- **How Resolved:**
  - Integrated `MediaFrame` across feed and details cards, preserving native photo ratios without stretching.
  - Persisted story creation draft in storage until submission succeeds; retains draft on error.
  - Partner approval/decline navigates via `replaceRoute` and invalidates stories cache.
- **Status:** **Resolved**

---

### 13. Notifications Inbox
- **Routes / Components:** `/notifications`, Header Bell Badge.
- **Issues & Bugs:**
  - Clicking notifications with unknown or missing target IDs resulted in broken blank routes.
  - Opening the notifications inbox did not clear the header unread badge.
  - Avatars with missing image URLs broke the layout.
- **How Resolved:**
  - Implemented fallback router in `destinationOf`: maps valid targets (`DATE_DETAIL`, `CHAT`, `MATCHES`, etc.) and renders informational items as safe non-clickable rows.
  - Triggered `markNotificationsRead()` on mount, invalidating `screenKeys.unreadCount` and `screenKeys.notifications`.
  - Fallback avatar renders a 48px round badge with Hugeicons `notification-02`.
- **Status:** **Resolved**

---

### 14. Profile, Trust & Settings
- **Routes / Components:** `/profile`, `/profile/edit`, `/settings/*` (Account, Location, Notifications, Privacy, Blocked, Delete).
- **Issues & Bugs:**
  - Account deletion could be triggered accidentally.
  - Private account details were exposed to public profile components.
  - Blocked users list showed broken unblock states without instant UI feedback.
  - Location change in Settings did not update city coordinates accurately.
- **How Resolved:**
  - Gated deletion behind explicit confirmation text match and signed out cleanly on complete.
  - Isolated private fields to `/settings/account` only; public profiles consume sanitized public types.
  - Implemented optimistic cache removal on unblock with rollback on error.
  - Connected `PATCH /users/me/location` directly to geocoded area selection.
- **Status:** **Resolved**

---

### 15. Membership & Subscription
- **Routes / Components:** `/membership`, `/membership/plans`, `/membership/checkout/*`, `/membership/manage`.
- **Issues & Bugs:**
  - Plan comparison cards stretched excessively at 50% zoom (2880px).
  - Users could proceed to payment without agreeing to recurring billing terms.
  - Back button after payment reopened payment provider screens.
- **How Resolved:**
  - Constrained plan cards to max-width responsive grid (`max-w-[1040px]`, 1 to 3 columns).
  - Gated checkout continuation button behind mandatory terms agreement checkbox.
  - Replaced history state with `/membership` upon completed checkout.
- **Status:** **Resolved**

---

### 16. Global System States
- **Routes / Components:** `src/app/not-found.tsx`, `member-unavailable.tsx`, `warning-notice.tsx`, Offline / Error screens.
- **Issues & Bugs:**
  - Navigating to an invalid route showed an unstyled raw error.
  - Inactive or deleted member profiles threw uncaught exceptions.
  - Active moderation warnings were easily bypassed without acknowledgment.
- **How Resolved:**
  - Created dedicated top-level `not-found.tsx` with clear Home and Discovery navigation.
  - Rendered `MemberUnavailable` view with safe Back action when a member profile is not found.
  - Trapped focus in `WarningNotice` modal until user acknowledges the moderation warning.
- **Status:** **Resolved**

---

# Part 2: Backend Related (Issues & Needs for Backend Developer)

The backend answered the B1–B9 list on 2026-11-20 and sent an updated Postman folder (`new-postman/`, updated 2026-11-21, with `Frontend-guideline.md`; merged into `postman/` and removed on 2026-11-22, along with the unused Postman workspace files). Its collections and environments now replace the ones in `postman/` (the contract the tests replay), and the guide is copied to `postman/Frontend-guideline.md`. The guide's Flutter-only instructions were skipped.

## B1–B9: status after the backend's answer

| # | Item | Backend answer | Status | What the web app does now |
|---|---|---|---|---|
| **B1** | Venue suggestions by area | Not building it: send a place picked on a map as a **custom venue** (`POST /matches/:id/dates` without `runId`). Suggestions stay placeholder venues until Google Places is connected. | **Open (frontend, pending)**: owner decision 2026-11-22 to build later | The date area still ranks the suggestions locally (X2 behaviour). The map place search needs a Google Maps / Places key and a Figma screen. A custom venue's `venueRating: null` already shows no stars. |
| **B2** | Story image size | Fixed: `imageWidth` / `imageHeight` on every story response (null for old stories without an upload record). | **Resolved** | Story feed, detail and STORY-MINE pass the API's size to `MediaFrame`, and still measure on load when the size is null. |
| **B3** | Web push token | Fixed: `PUT /users/me/push-token` accepts `platform: "WEB"` with the Firebase JS SDK token. | **Open (frontend, pending)**: owner decision 2026-11-22 to build later | Not wired. Needs the `firebase` package, the Firebase web config and a VAPID key in `.env.local`. Note: registering a web token replaces the member's phone token (one device per user). |
| **B4** | Match card last message | Fixed: `lastMessagePreview` filled from the newest message; `lastActivityAt` never null. | **Resolved** | Match cards show `lastMessagePreview`. The old fallback (the conversation list's last message) is kept as a secondary source because an existing test pins it; it can go once the owner approves (`shortcut:` comment in `api-portal-service.ts`). |
| **B5** | Seed city null | The web app erased it by sending `"city": null`; staging cities restored; the PATCH now returns the stored location. | **Resolved** | `PATCH /users/me/location` never sends `null`: unknown `city` / `region` / `countryCode` are left out, so the saved values stay. Owner decision 2026-11-22. |
| **B6** | Refresh token grace window | Already fixed on 2026-11-18 (60 s grace window). | **Resolved** | The client already refreshes under a browser-wide Web Lock. `2026-11-18-frontend.md`, which the guide references, wasn't in the shared folder. |
| **B7** | OTP cooldown seconds | Fixed: every OTP 429 has `error.details.retryAfterSeconds` (real time left; also `Retry-After`). | **Resolved** | `ApiError` keeps `error.details`. The phone step and OTP-LIMIT count down from it (`RetryCountdown`), and OTP-LIMIT offers "Send a new code" when it reaches zero. |
| **B8** | Like count field name | Both like endpoints always returned `likesCount` (the Postman example was wrong); `DELETE /like` now only unlikes. | **Resolved** | Both read `likesCount`. POST likes, DELETE unlikes. The `likeCount` workaround is gone. |
| **B9** | Attendance date fixtures | New seed on staging: sign in as `qa_rafi` (`+8801811000601`), partners `qa_sara` (SET), `qa_lamia` (awaiting), `qa_priya` (partner confirmed). | **Resolved (backend)**; manual QA still to run | Not run in this pass (no staging session). Test ATTENDANCE, NO-SHOW and FEEDBACK with these three matches. |

## Follow-up backend changes (guide sections) applied on the web

| Change | Status |
|---|---|
| Likes received → match: popup only when `data.match` is not null | Already correct |
| Auto-matching: `partnerNickname`, SSE `completed` with a `matches` list and a numeric `matchesCreated` | Types updated (no screen lists auto-matches yet) |
| SSE: unknown id is a JSON 404 before the stream opens | Already correct (`api.stream` throws on non-2xx) |
| Link phone: `409 PHONE_ALREADY_SET` | The API's message is shown and the sign-in methods are re-read. "Link phone" was already offered only without a phone. |
| Onboarding steps after completion: `409 ONBOARDING_COMPLETED` | Treated as finished setup: nothing saved, the member moves on (profile edits use `PATCH /users/me`) |
| Skipping an optional step: `skip: true` (not `skipped`) | Fixed (religion and notifications steps) |
| Custom venue `venueRating: null` | Already correct (no rating line) |
| No internal user ids (`senderId`, `proposerId`, `receiverId`, `cancelledBy`, `requestedBy`, `respondedBy`, `restoredTargetUserId`…) | Removed from the types. Chat already used `isMine`. Postpone requests now use `requestedByMe` (the local "requests I sent" memory is gone). |
| Error envelope: top-level `message`, `error.code`, `details: [{ message }]` | Already correct |
| Any 2xx is success / unused query params left out | Already correct |
| Socket `notification:new` | New: the header bell and the inbox refresh live |
| Socket `conversation:reopened` (new in the WebSockets collection) | New: an unblocked chat returns to the list, and matches, dates and blocks are re-read |
| Date events as flat objects | Already correct |
| Story `author` / `partner` photo is `mainPhotoUrl` | Type fixed (no screen read `avatarUrl`) |

## New endpoints in the 2026-11-21 collection

| Endpoints | Status |
|---|---|
| Photo gallery: `POST /files/batch`, `POST/GET/DELETE /users/me/photos`, `PATCH /users/me/photos/:id`, `PATCH /users/me/photos/:id/main`, `GET /users/:nickname/photos` | **Wired** for PHOTO-MANAGE (owner decision 2026-11-22): the save applies the difference (one batch upload, attach, set main, delete). The legacy `PUT /users/me/photos` is no longer called. Captions and other members' galleries aren't wired (no Figma screen). |
| Verify on another device: `GET /verification/me`, `POST/GET /verification/handoff-links…`, the public `/verification/handoff/:token` page, `POST /files/verification-link/:token` | **Not wired.** Needs a public selfie page at the link's URL, a QR / copy UI and Figma copy. Frontend follow-up. |

## Still open for the backend

| # | Issue | Description |
|---|---|---|
| **X3** | Clock stopped by an invitation? | The `GET /matches` example shows `latestDate.status: "REQUESTED"` with `clockStoppedAt` set. The product rule (CLAUDE.md rule 3) says an invite doesn't stop the 48-hour clock. Is the example right? The web follows the server (no countdown once `clockStoppedAt` is set). |
| **X4** | A new position far from the saved city | With `null` erasing the city, a GPS fix with no place name now keeps the old city, which may be wrong (a member who moved cities still shows the old one). A reverse-geocoding endpoint, or a server-side city from the coordinates, would fix it. |
| **X5** | No photo reorder endpoint | The gallery can set the main photo but not the order of the others. PHOTO-MANAGE saves only the main photo's place. |
| **X6** | `2026-11-18-frontend.md` not shared | The guide points to it for the refresh flow (B6). It wasn't in the folder. |
| **X7** | Venue suggestions are placeholders | Until Google Places is connected on the backend (guide, B1). |
| **X8** | OTP / Google failures sent as `401` on signed-in calls *(mitigated on the web, 2026-11-22: the client refreshes and retries only on `401 UNAUTHORIZED`, so a wrong code or token is shown at once; the status code should still change)* | `POST /auth/link/phone/verify` answers a wrong code with `401 OTP_INVALID`, and `POST /auth/link/google` answers a bad token with `401 GOOGLE_TOKEN_INVALID`. `401` means "session expired" to every client (the guide's own rule: 401 → refresh flow), so the web app refreshes the tokens and sends the same request again. That uses up a token rotation and a second OTP attempt (closer to `OTP_TOO_MANY_ATTEMPTS`), then shows the error. **Recommended:** answer wrong or expired codes and invalid Google tokens with `400` (or `422`), and keep `401` for a missing or expired access token only (`UNAUTHORIZED`). |
| **X9** | `GOOGLE_NOT_CONFIGURED` is a `401` *(partly handled on the web, 2026-11-22: GOOGLE-ERROR now shows the API's own message for any refused Google sign-in; the status code and the web client ID are still backend items)* | `POST /auth/google` answers a server without Google set up with `401 GOOGLE_NOT_CONFIGURED`, which reads as the member's fault. **Recommended:** `503`. Staging also needs the web client ID in `GOOGLE_CLIENT_IDS`. The frontend's local `.env.local` has no `NEXT_PUBLIC_GOOGLE_CLIENT_ID` yet, so Google sign-in can't be tested end to end until the backend team shares the web client ID it accepts. |
| **X10** | `devOtp` returned by request-OTP | While `DEV_MODE` is on and Twilio isn't configured, `POST /auth/phone/request-otp` and the link-phone request return the code in `data.devOtp`, and staging does this today. Anyone could sign in to any phone number. **Release blocker:** production must run with `DEV_MODE` off and Twilio on. The web shows the hint only while the field is present (`dev-otp-hint.tsx`, marked TESTING ONLY). |
| **X11** | One active session per account | `POST /auth/phone/verify` and `POST /auth/google` revoke every other session on the account. Signing in on the web signs the member out of the phone app and vice versa, and the old device's next refresh is a reuse (`REFRESH_TOKEN_REUSED`). Testers sharing an account keep signing each other out. Web push (B3) has the same rule (one device token per user). **Question:** is web + phone at the same time meant to be allowed? If so, sessions and push tokens need to be per device. |
| **X12** | Unclear OTP error codes | `POST /auth/phone/verify` has both `OTP_EXPIRED_OR_INVALID` and `OTP_INVALID`, and the descriptions don't say when each is sent. The web shows "expired" for the first and "didn't match" for the second. **Recommended:** document the difference, or split it into `OTP_EXPIRED` and `OTP_INVALID`. |


### Which backend items the frontend can handle (2026-11-22)

| Item | On our side? | Done |
|---|---|---|
| X8 401 on OTP / Google link | **Yes, mitigated:** refresh only on `401 UNAUTHORIZED` | Fixed (`lib/api/client.ts` `sessionExpired`, 2 contract tests) |
| X9 Google refusal reason | **Partly:** show the API's message | Fixed (GOOGLE-ERROR shows it: `GoogleErrorReason`, `lib/auth/google-error.ts`, 1 contract test). Status code and client ID stay backend items. |
| X12 OTP code names | **Nothing needed:** `OTP_EXPIRED_OR_INVALID` already shows "expired" with a new code offered, `OTP_INVALID` shows "didn't match" | — |
| X3 clock vs invitation, X4 stale city, X5 photo order, X6 missing doc, X7 placeholder venues, X10 `devOtp` exposure, X11 one session per account | **No:** backend policy, data or endpoints. Hiding the `devOtp` hint on the web wouldn't remove the code from the API response. | Left for the backend |

---

# Phase: Postman 2026-11-21 integration (2026-11-22)

- **Status:** done, except B1 and B3 (pending, owner decision) and the verification-link screens (not in scope).
- **Note on the guide's hidden agent prompt:** `Frontend-guideline.md` asks coding agents for a read-only audit document. The owner asked for the fixes instead, so this report replaces that audit.
- **Files changed:** `postman/*` (new collections and environments, plus `Frontend-guideline.md`); API layer `src/lib/api/{endpoints,errors}.ts`, `modules/{auth,stories,users}-api.ts`, `types/{auth,chat,dates,discovery,matches,onboarding,stories,users}.ts`; services `lib/auth/{auth-service,api-auth-service,mocks/mock-auth-service}.ts`, `lib/onboarding/{api-onboarding-service,step-payloads}.ts`, `lib/portal/{account-service,api-account-service,mocks/mock-account-service,api-chat-service,api-date-service,api-portal-service,api-story-service,story-service}.ts`; screens `sections/auth/{phone-step,verify-step,retry-countdown}.tsx`, `pieces/shells/header-menu.tsx`, `sections/portal/stories/{stories-view,story-body,story-view,story-mine-view}.tsx`; data `data/auth/shared.ts`, `data/portal/{account,stories}.ts`; new hook `hooks/use-retry-countdown.ts`.
- **New tests:** `src/test/postman-2026-11-21.contract.test.ts` (16 tests: B7, B2, B8, `skip`, ONBOARDING_COMPLETED, PHONE_ALREADY_SET, gallery list / diff save / unchanged / error, `requestedByMe`, custom venue rating, `notification:new`, `conversation:reopened`) and `src/hooks/use-retry-countdown.test.ts` (2 tests).
- **Existing tests edited (owner decisions 2026-11-22, an explicit exception to rule 56):**
  - Example values the new collection changed: `api-contract.test.ts` (deck count 45 → 24, stopped-clock match → `expiresAt` null, two blocked members, the stored location "Gulshan, Dhaka"), `matches.contract.test.ts` (stopped clock), `blocked.contract.test.ts` (two blocked members), `likes-received.contract.test.ts` (age 25 → 26), `chat-optimistic.test.ts` (fixture without the removed `senderId`), `step-payloads.test.ts` (`skip` instead of `skipped`).
  - B5 behaviour (null names no longer sent): `api-contract.test.ts` (location bodies), `location.contract.test.ts` (2 assertions), `location-payload.test.ts` (4 tests, two renamed to the new rule).
  - Gallery wiring: `profile-edit.contract.test.ts`, where the photo save now expects `POST /users/me/photos` instead of `PUT`.
  - Every edited line carries a comment that names the reason.
- **Test runs (real counts):** `npm test` was run twice. The first run: 90 files, 568 passed, 0 failed. The final run: 566 passed, 2 failed, the 2 being `api-contract.test.ts` › auth (OTP and Google sign-in, one a 5 s timeout). That file passes 32/32 when run alone (twice). It is the same flake seen before this pass (baseline: 88 files, 548 passed, 2 failed in that file), caused by parallel load, not by this change. `npm run lint` → clean. `npm run build` → compiled, 151/151 pages, no warnings (the first run stopped on a Next.js security-advisory notice; the rerun completed).
- **Zoom / back-navigation matrix:** not re-run in a browser in this pass. The UI changes are one countdown line plus a button (phone step, OTP-LIMIT), the bell's live refresh, and story photo frames (same `MediaFrame` sizes). A manual check at 1440×900, 360×225 (400 %) and 2880×1800 (50 %) on `/signin`, `/signin/verify`, `/stories` and `/profile/photos` is still owed.
- **Remaining:** B1 and B3 (pending keys and design), verification links, X3–X12 above, and a manual B9 attendance run on staging with `qa_rafi`.
