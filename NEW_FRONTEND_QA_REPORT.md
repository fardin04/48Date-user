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

The following list contains all unresolved backend gaps, missing endpoints, schema mismatches, and recommended fixes identified during frontend integration and QA (verified against the updated Postman collection in `new-postman/`):

| # | Issue / Need | Related Module | Description & Recommended Backend Fix |
|---|---|---|---|
| **B1** | **Venue Suggestions Area Search** | Date Planning | `POST /matches/:id/venue-suggestions` only accepts `category` and computes midpoint server-side. Frontend needs date-specific area filtering. **Recommended:** Accept `{ latitude, longitude, radiusKm }` or `{ areaLabel }` in the request body. |
| **B2** | **Story Image Dimensions Omitted** | Success Stories | `GET /success-stories` and `GET /success-stories/:id` omit `imageWidth` and `imageHeight`. Frontend must calculate aspect ratios on client load. **Recommended:** Include `imageWidth` and `imageHeight` in the story response payload and accept them on create/update. |
| **B3** | **Web Push Token Support** | Settings / Notifications | `PUT /users/me/push-token` and `DELETE /users/me/push-token` only accept platform enum `IOS` or `ANDROID`. **Recommended:** Add `WEB` to accepted platforms with VAPID subscription payload for browser notifications. |
| **B4** | **Match Card Last Message Preview Null** | Matches | `GET /matches` returns `lastMessagePreview: null` and null activity timestamp even when active conversations have messages. **Recommended:** Populate `lastMessagePreview` and `lastActivityAt` directly from conversation history in the matches query. |
| **B5** | **Seed Account Location City Null** | Discovery / Seed Data | Seed accounts (e.g. `tahmid_hasan`) have null `city` / area in `GET /users/me`, leaving location rows empty on Discovery cards. **Recommended:** Populate default area/city labels in seed user profiles. |
| **B6** | **Refresh Token Rotation Grace Window** | Authentication | `POST /auth/refresh` rotates tokens immediately. If a browser tab reloads or closes while a refresh request is in flight, the old token is reused on next load, causing the backend to revoke all sessions (`REFRESH_TOKEN_REUSED`). **Recommended:** Provide a short grace period (e.g., 30 seconds) where the immediate previous refresh token returns the active session pair instead of invalidating the account. |
| **B7** | **OTP Cooldown Timer Missing Seconds** | Authentication | When OTP is requested too quickly, `POST /auth/phone/request-otp` returns error `OTP_COOLDOWN` without remaining seconds. **Recommended:** Return `{ retryAfterSeconds: number }` in the 429 error payload so frontend can display an exact countdown timer. |
| **B8** | **Inconsistent Like Count Field Name** | Success Stories | Story like endpoint (`POST /success-stories/:id/like`) returns `likesCount`, whereas unlike (`DELETE /success-stories/:id/like`) returns `likeCount`. **Recommended:** Standardize field name to `likeCount` across both responses. |
| **B9** | **Seeded Past/Completed Date Fixtures** | Date Planning / QA | All seed date fixtures in staging are currently `COMPLETED`. Testing the attendance confirmation screen (`ATTENDANCE`) and feedback submission requires test dates in `SET` (with past scheduled time) and `AWAITING_CONFIRMATION` states. **Recommended:** Add automated seed fixtures for active and awaiting-confirmation dates. |
