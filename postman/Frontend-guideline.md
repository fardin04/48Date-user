# Backend changes of 2026-11-20 (updated 2026-11-21): answers to the frontend B1–B9 list

<!--
=====================================================================
PROMPT FOR THE AI CODING AGENT OF THE WEB FRONTEND DEVELOPER
(hidden in rendered Markdown; human readers can ignore this block)
=====================================================================
You are auditing the 48Date WEB USER APP (the browser app for end users, not the admin panel).
Web specifics to check as well: B3 browser push (Firebase JS SDK `getToken(messaging, { vapidKey })`, then `PUT /users/me/push-token` with `platform: "WEB"`; token string only, not a Web Push subscription object); CORS-readable `Retry-After` is optional, the body field `error.details.retryAfterSeconds` is the one to use; cross-tab refresh lock (Web Locks or BroadcastChannel).

INPUTS (shared with this file):
- `48Date-Backend.postman_collection.json`: the REST API. Use only the `User` folder (the `Admin` folder belongs to the admin panel, ignore it).
- `48Date-WebSockets.postman_collection.json`: the Socket.IO events (client emits and server broadcasts).
- `48Date-Dokploy-Staging.postman_environment.json`: staging base URL and variables.
- This guide: the backend changes of 2026-11-20 (sections B1 to B9), "Changes from follow-up backend fixes" (including the 2026-11-21 sections "Date planner: venue distance and custom venue rating" and "No internal user ids in any response"), and "Postman corrections".
The Postman collections were audited against the backend code and live responses on 2026-11-20 and updated on 2026-11-21. Treat them as the contract. Every response is `{ success, message, data, meta? }` on success and `{ success: false, message, error: { code, details? } }` on error.

YOUR JOB: a complete, read-only audit of this app against the Postman contract. You do NOT fix anything.

HARD RULES
1. Do not modify, refactor, format or delete any app code, config, dependency or test. The only file you may create or edit is the audit document described below.
2. Do not start fixing after the audit, not even "small" or "obvious" fixes. Fixing starts only after the developer reviews the audit and tells you, item by item, what to fix.
3. Evidence only. Every finding cites the app file and line (`path:line`) and the Postman request name (e.g. `User / 04 - Matches / 01 Get Matches List`) or socket event. If you are not sure, re-read both sides; if still unsure, list it under "Needs confirmation", never as a finding.
4. No assumptions about backend behaviour beyond Postman and this guide. If Postman and this guide disagree, record it under "Questions for the backend".

WHAT TO CHECK, for every request in the `User` folder and every socket event:
a. Is it used? Find every place the app calls it. List requests/events the app never uses and say whether a screen should be using it (missing feature) or it is genuinely not needed.
b. Request: HTTP method, path, path params (the app uses nicknames, never internal user ids), auth header (`Authorization: Bearer <accessToken>`), body field names and casing, required vs optional, allowed values (case-sensitive enums), types, and fields the app sends that Postman does not list (the backend rejects unknown fields with 400).
c. Query params: filters, search, sorting, and the right pagination style for that endpoint (`cursor`+`limit` feeds vs `page`+`limit` lists), and that the app reads `meta` to load more.
d. Response parsing: the envelope; every field the app reads exists with that exact name, type and nullability in the saved success examples; nested objects (`otherUser`, `counterpart`, `latestDate`, `author`, `partner`…); fields the app ignores but should show.
e. Status codes: any 2xx is success (POST actions return 201, some 200, run starts 202). Flag code that requires exactly 200.
f. Errors: the app shows top-level `message` and branches on `error.code`; handles every error example saved for that request (401 session expired → refresh flow, 403, 404, 409, 429 with `error.details.retryAfterSeconds`); no code that reads `error.message`, `statusCode` or a `messages` array.
g. Auth and session: sign-in flows, token storage, one refresh at a time (see `2026-11-18-frontend.md`), `REFRESH_TOKEN_REUSED`/`REFRESH_TOKEN_INVALID` → sign-in.
h. Socket.IO: connection auth, rooms joined, every server event the app should listen to (incl. `notification:new`, all `date:*`, `message:*`, `conversation:*`, `game:*`, `typing`), payload field names (flat objects, not wrapped), and client emits.
i. The B1–B9 changes, "Changes from follow-up backend fixes" and "Postman corrections" in this guide: verify each one specifically.
j. Calls the app makes that are not in Postman at all (dead or removed endpoints).
k. Internal user ids: the app must never read or send internal user ids. Flag any code that reads `senderId`, `userId`, `reporterId`, `reportedUserId`, `reviewerId`, `reviewedUserId`, `proposerId`, `receiverId` or `partnerId` from a response (removed on 2026-11-21; see "No internal user ids in any response"), and any code that decides "my message or theirs" by comparing ids instead of `isMine`.

AUDIT DOCUMENT
Create `docs/api-audit/2026-11-21-postman-audit.md` (or, if the project already has a docs folder or a decisions/issues log, put it there and link it from that log). Structure:
1. Summary: date, app commit/branch audited, counts by severity, the 5 most important findings.
2. Findings table: `ID | Severity (Critical/High/Medium/Low) | Area / screen | Postman request or event | App location (path:line) | What the app does | What Postman says | Suggested fix | Decision needed`.
   - Critical: breaks a feature or loses data (wrong path/field, rejected body, crash on a response).
   - High: wrong behaviour visible to users (wrong field shown, missing error handling, wrong pagination).
   - Medium: fragile or incomplete (hard-coded 200, missing optional field, unused useful endpoint).
   - Low: cosmetic or cleanup.
3. Not used by the app: each unused request/event, and whether it should be.
4. Needs confirmation: items you could not prove either way.
5. Questions for the backend: where Postman or this guide looked wrong or unclear.
6. Decisions log: one line per finding with `Status: OPEN` for the developer to fill in (FIX / WON'T FIX / LATER).
Before saving, re-check every finding against the Postman example once more and remove anything you cannot prove.

WHEN YOU FINISH
Reply to the developer with: where the audit document is, the counts by severity, the top 5 findings in one line each, and the list of decisions you need. Then stop and wait. Remind the developer that nothing has been changed and that each finding needs a FIX / WON'T FIX / LATER decision before you touch any code.
=====================================================================
-->

<!--


**Audience:** the developers of the user apps (web and Flutter) and their AI coding agents.
**What's in it:** our answer to each item of your B1–B9 report (what we found, what we changed, what you need to do), changes from the backend fixes that followed, the corrections made to the Postman collections, and a checklist.

**Prompt for your AI coding agent:** at the end of this file ("Prompts for your AI coding agent"), one for the web app and one for Flutter. The same prompts are also hidden at the top for agents that read the file directly.

**Files shared with this guide:** `48Date-Backend.postman_collection.json` (REST), `48Date-WebSockets.postman_collection.json` (Socket.IO), `48Date-Dokploy-Staging.postman_environment.json`. Use these copies, not older exports: both collections were audited against the backend code and live responses on 2026-11-20 (see "Postman corrections").

## Your report, item by item

| # | You reported | What we found | What we did | What you need to do |
|---|---|---|---|---|
| B1 | Venue suggestions can't be filtered by area | Planning a date at any place already works: the date invite accepts a custom venue | Nothing to build; documented it with a live example | Let the user pick a place on your map and send it as a custom venue (section B1) |
| B2 | Story responses have no image size | Correct | Stories now return `imageWidth` / `imageHeight` | Use them to size story cards; keep a fallback when `null` |
| B3 | Push token only accepts `IOS` / `ANDROID` | Correct | `platform: "WEB"` is accepted (Firebase web token) | Web: register the browser token. Flutter: no change |
| B4 | Match cards have `lastMessagePreview: null` | Correct: it was never filled | Filled from the newest chat message; `lastActivityAt` never null | Show the preview on match cards |
| B5 | Seed accounts have no city | The seed was right; the city was erased by a location update that sent `"city": null` | Location update now returns the saved values; staging seed re-run, cities restored | Leave `city` out of `PATCH /users/me/location` when you have no place name |
| B6 | Refresh token reuse signs users out | Correct | Already fixed on 2026-11-18 (60 s grace window) | Follow `2026-11-18-frontend.md` |
| B7 | OTP cooldown has no seconds | The seconds were only in a header browsers couldn't read | Added `error.details.retryAfterSeconds` (real time left) | Count down from it |
| B8 | Like returns `likesCount`, unlike `likeCount` | Both always returned `likesCount`; the Postman example was wrong. Unlike could also *like* a story by mistake | Postman fixed; `DELETE /like` now only unlikes | Read `likesCount`; POST to like, DELETE to unlike |
| B9 | No test dates for the attendance screens | Correct | New seed with three dates in the attendance flow, run on staging | Test with `qa_rafi` (section B9) |

## B2: story image size

- `GET /success-stories`, `GET /success-stories/:id`, `GET /users/me/success-stories`, create/edit responses and the admin story drawer now include `imageWidth` and `imageHeight` (integer or `null`).
- When `imageUrl` came from the upload API (the normal case), the backend reads the real size from the upload record. You don't need to send anything.
- `POST /success-stories` and `PATCH /success-stories/:id` also accept optional `imageWidth` / `imageHeight` (integers 1–20000). They are used only when the URL didn't come from the upload API.
- Stories created before this change got their size filled in by the migration where the upload record exists. Otherwise both are `null`, so keep a fallback (measure on load, or use a fixed aspect ratio).

## B3: web push

- `PUT /users/me/push-token` accepts `"platform": "WEB"`.
- Send the **FCM registration token** from the Firebase JS SDK: `getToken(messaging, { vapidKey })`. The VAPID key stays in the browser. The backend needs only the token and sends through FCM like any phone. No raw Web Push subscription object.
- One device per user still applies: registering a web token replaces the phone's token for that user.

## B4: match card last message

- `GET /matches`, `GET /matches/unseen` and `GET /matches/:id` now return `lastMessagePreview`: the newest chat message as one line, the same text as the chats list (`📷 Photo`, `🎤 Voice message`, `📅 …`, `🎮 …`, `[This message was deleted]`). It is `null` before the first message.
- `lastActivityAt` is never `null`: it is the later of the newest message and the match's own activity, falling back to the match creation time.

## B5: seed account city

- The seed does set a city for every seed user (`tahmid_hasan` → `Uttara, Dhaka`).
- `city` is cleared when a client calls `PATCH /users/me/location` with `"city": null`. Most likely the web build did that after taking a browser GPS fix without a place name.
- **App rule:** on a coordinates-only refresh, **leave `city` out** of the body (don't send `null` or `""`). The saved city is then kept. Send `city` only when you have a reverse-geocoded name.
- Fix on our side: `PATCH /users/me/location` now returns the **stored** location (including the kept city) instead of echoing the request.
- The staging seed users' cities were restored on 2026-11-20 (`npm run db:seed:story-test` re-run).

## B7: OTP cooldown countdown

- Every 429 from `POST /auth/phone/request-otp` and `POST /auth/link/phone/request-otp` (`OTP_COOLDOWN`, `OTP_HOURLY_LIMIT`, `OTP_DAILY_LIMIT`, `OTP_IP_LIMIT`) now has:
  ```json
  { "success": false, "message": "Please wait 42 seconds before requesting another code.",
    "error": { "code": "OTP_COOLDOWN", "details": { "retryAfterSeconds": 42 } } }
  ```
- The seconds are the real time left: the hourly, daily and IP limits now count down to the actual reset instead of a fixed 3600/86400.
- The `Retry-After` header carries the same number, and is now readable from browsers (CORS `exposedHeaders`).

## B8: like count field

- Both like endpoints return `{ isLiked, likesCount }`. The `likeCount` in the old Postman example was a documentation mistake, now fixed. `likesCount` matches the field on the story itself.
- Behaviour fix: `DELETE /success-stories/:id/like` used to toggle, so calling it on a story you hadn't liked would *like* it. Now it only removes a like; on a story that isn't liked it returns `isLiked: false` with the unchanged count.
- `POST /success-stories/:id/like` is still a toggle. Use POST to like and DELETE to unlike, and the result is always what the user tapped.

## B9: date fixtures for the attendance screens

New additive seed `npm run db:seed:date-fixtures`, already run on staging (2026-11-20); the owner can re-run it to reset the dates. Sign in as **`qa_rafi`** (`+8801811000601`, dev OTP when `DEV_MODE=true`). He has three matches:

| Partner (phone) | Date state after seeding | What to test |
|---|---|---|
| `qa_sara` (…602) | `SET`, starts 20 minutes after seeding | The real `SET → AWAITING_CONFIRMATION` move (15-minute sweep): chat bubble update, `date:awaiting_confirmation` socket event, push |
| `qa_lamia` (…603) | `AWAITING_CONFIRMATION`, nobody confirmed | Attendance screen from scratch, both sides |
| `qa_priya` (…604) | `AWAITING_CONFIRMATION`, Priya already confirmed she attended | Rafi confirms → date `COMPLETED` → rating/feedback |

Re-running the seed puts all three dates back to these starting states. A `SET` date whose time has passed can also be confirmed directly (the backend accepts `SET` or `AWAITING_CONFIRMATION`), but the sweep moves it to `AWAITING_CONFIRMATION` within 15 minutes, so it can't be a stable fixture.

## B1: venue search area (not building, already possible)

Planning a date in a specific area already works: let the user find the place on your map (Google Maps place search), then send it as a **custom venue** with `POST /matches/:matchId/dates`, **without** `runId`:

```json
{ "venueRef": "<Google place_id or your own id>", "venueName": "Cafe Mango", "venueAddress": "Road 11, Gulshan 1, Dhaka",
  "venueCategory": "Cafe", "latitude": 23.7925, "longitude": 90.4078, "scheduledAt": "2026-11-25T14:00:00.000Z", "timeZone": "Asia/Dhaka" }
```

The backend stores the place exactly as sent. `POST /matches/:id/venue-suggestions` stays the "between you two" suggestions list (only `category`). Note: those suggestions are still placeholder venues until Google Places is connected on the backend.

## Changes from follow-up backend fixes

After your report we checked the whole API live and fixed what we found. Only the items below can affect the apps.

### Like back from "Likes received": the match message

`POST /discovery/likes-received/:nickname/match` used to reply "It's a match!" even when no match was created. Now it behaves like a normal swipe:

| Case | Status | `message` | `data.match` |
|---|---|---|---|
| They liked you → match created | `201` | "It's a match!" | match object (`id`, `conversationId`, `matchedUser`) |
| They haven't liked you, or you repeat a like you already sent | `201` | "Swipe recorded successfully." | `null` |
| Already matched, blocked/unavailable, or unknown nickname | `409` `USER_UNAVAILABLE` | "This user profile is no longer available." | (error) |

**What to do:** open the match popup only when `data.match` is not null. Never decide from the message text.

### Auto-matching: partner nickname instead of an internal id

Two responses used to include the partner's internal user id (`partnerId`). Internal ids must never reach the apps, so it is now the nickname.

- `GET /matching/me`: `data.matchesCreated` items are now `{ matchId, partnerNickname, score }` (was `{ matchId, partnerId, score }`).
- SSE `GET /matching/runs/:id/events`, event `completed`: `matchesCreated` is now a **number** (as in the `snapshot` event) and the list moved to a new `matches` field: `[{ matchId, partnerNickname, score }]`. With no matches: `matchesCreated: 0`, `matches: []`, plus `emptyReason` and `tips`.

**What to do:** read `partnerNickname` (not `partnerId`); in the `completed` event read the list from `matches` and treat `matchesCreated` as a count.

### Live streams (SSE): unknown id is always a normal error

Discovery runs, auto-matching runs, verification and reply-suggestion streams used to answer an unknown id either with a JSON `404` or with `200` and an `event: error`, depending on timing. Now the id is checked before the stream opens: an unknown id is always a JSON `404` (a verification of another user is `403`), never a `200` stream.

**What to do:** treat a non-2xx response from a stream URL as the error (show `message`); you can drop handling for an `error` event caused by a bad id.

### Link phone: an existing phone is never replaced

`POST /auth/link/phone/request-otp` and `POST /auth/link/phone/verify` used to overwrite the account's phone after a code was verified on a new number. Now, when the account already has a phone, both reply **`409` `PHONE_ALREADY_SET`** ("Your account already has a phone number."), and the request step sends no SMS. `409 PHONE_ALREADY_LINKED` (the number belongs to another account) is unchanged. A real "change phone" flow will come later as its own feature.

**What to do:** show "Link phone" only when the account has no phone; handle `PHONE_ALREADY_SET` by showing `message`.

### Onboarding steps after onboarding is complete

`PUT /onboarding/steps/:step` used to keep saving after onboarding was done, and could move the user back to `IN_PROGRESS`. Now, once `onboardingStatus` is `COMPLETED`:

| Steps | Result |
|---|---|
| `location` … `photos` (every step up to and including the last required one) | **`409` `ONBOARDING_COMPLETED`**, nothing saved |
| `selfie`, `notifications` (the optional steps after `photos`) | Still accepted, as in your normal flow; status stays `COMPLETED` |

`onboardingStatus` never goes back from `COMPLETED` to `IN_PROGRESS`.

**What to do:** after onboarding, edit profile data with `PATCH /users/me` (languages, education, religion, bio and the rest), `PATCH /users/me/location` and the photo gallery endpoints. Real name and birth date can't be changed after onboarding (D-52).

### Skipping an optional onboarding step: the field is `skip`

Postman said `skipped: true`. The backend reads **`skip: true`**: `{ "skip": true }` marks an optional step (location, education, religion, bio, selfie, notifications) as skipped. Sending `skipped` is ignored, so the step is saved as done with an empty value (or fails validation).

**What to do:** send `skip: true`, not `skipped`.

### Date planner: venue distance and custom venue rating (2026-11-21)

- **`distanceKmFromMe` on venue suggestions** is now always measured from the signed-in user, in every response: `POST /matches/:matchId/venue-suggestions`, `GET /venue-suggestions/:runId` and the live `venues` / `completed` events of `GET /venue-suggestions/:runId/events`. Before, the live stream could send the other person's distance to one of the two users. Same field, same shape.
- **Custom venues have no rating.** A date at a place the user picked on the map (no `runId`, or a `venueRef` not in that run) used to get a made-up `venueRating: 4.8`. It is now **`venueRating: null`** (and `venuePhotoRef: null`, as before) in the date invite response, date details, the dates list and everything else that returns a date. Venues picked from the suggestions keep their rating.

**What to do:** show no stars (or "No rating") when `venueRating` is `null`. No change for the distance.

### No internal user ids in any response (2026-11-21)

Internal user ids must never reach the apps (people are identified by nickname). A last check found a few responses that still sent them; they are removed:

| Where | Removed | Use instead |
|---|---|---|
| Chat messages: `GET /conversations/:id/messages`, send, edit, socket `message:new` | `senderId` | `isMine` (is it mine?) and `senderNickname` |
| Date invite chat bubble `payload` (history and `message:new`) | `proposerId`, `receiverId` (also stripped from older messages) | The bubble's own `isMine` / `senderNickname`: the sender is the person who proposed |
| `POST /reports` response | `reporterId`, `reportedUserId` | `reportedNickname` (`reporterNickname` is you) |
| `GET` / `PATCH /dates/:id/rating` | `reviewerId`, `reviewedUserId` | New **`reviewedNickname`**: the person you rated |
| Face verification start and snapshot (`POST /verification`, `GET /verification/:id`, SSE) | `userId` | Nothing needed: it is always you |
| `GET /subscriptions/me` (`subscription`), start, cancel | `userId` | Nothing needed: it is always you |

**What to do:** if your code reads any of these fields, switch to the replacement. The most likely one is chat: decide "my message or theirs" with `isMine`, never by comparing ids.

## Postman corrections (may affect existing code)

The collection was audited request by request against the code and live responses. All requests match a real route (299 on 2026-11-21: 155 in `User`, the rest in `Admin` and System), and every saved example now shows what the backend actually returns. If your app was built from the old examples, check these:

| What was wrong in Postman | Correct |
|---|---|
| Story `author` / `partner` photo shown as `avatarUrl` (feed, detail, comments, eligible dates) | The field is **`mainPhotoUrl`** |
| Date `counterpart` showed `gender`, `location`, `occupation`, `mainPhoto`, `verificationStatus` | Real fields include `mainPhotoUrl` and `isVerified` (see `07 - Dates / 05` and `06`) |
| Error examples like `{ "error": { "code", "message" } }`, `{ "statusCode", "error": "Conflict" }`, `{ "status": "error" }` | Always `{ "success": false, "message", "error": { "code", "details"? } }`. Read the text from top-level `message` |
| Success examples like `{ "statusCode": 200, ... }` or `{ "status": "success", ... }`, some with a `messages` array | Always `{ "success": true, "message", "data", "meta"? }`. There is no `messages` array |
| 47 error examples used codes the backend never sends (e.g. `ADMIN_UNAUTHORIZED`, `VERIFICATION_NOT_FOUND`, `CHAT_NOT_FOUND`) | Replaced with the real codes (often the generic `NOT_FOUND`, `BAD_REQUEST`, `FORBIDDEN`) |
| Plain POST actions shown as `200` (swipe, mark seen, like, consent, warning acknowledge, …) | They return **`201`**. `POST /matches/:id/dates` returns **`200`**. Treat any 2xx as success |
| `latestDate`, `dateHistory`, entitlement keys, message `isEdited`/`isDeleted`, `hideOnlineStatus`, photo `createdAt` missing from examples | Added |
| `PATCH /users/me/location` and `POST /matches/:id/dates` descriptions out of date (`venueRef` is **required**, `venueCategory` is free text) | Rewritten, with a custom-venue example |
| 52 signed-in requests had no error example | Each now has its `401` example |
| Validation errors showed `error.details: [{ "field", "message" }]`, some with field names that don't exist | `VALIDATION_FAILED` details are **`[{ "message" }]` only** (no `field`). Show `message`; use `details[].message` only for extra detail |
| Discover cards (deck, timeline, undo `restoredCard`) missing fields | Cards also have `isSuperLike`, `photoCount`, `photos[].caption`, `photos[].isMain` |
| Venue suggestion items showed `priceLevel` and `distanceKm` | Real items: `venueRef`, `name`, `category`, `address`, `latitude`, `longitude`, `distanceKmFromMe`, `rating`, `reviewCount`, `photoUrl`, `isPublic`, `isAiPick` |
| `POST /conversations/:id/seen` response | `data: { "success": true, "seenUpToSeq": n }` |
| `POST /conversations/:id/messages` body listed every field for every type | Per type: `TEXT` → `text`; `IMAGE` → `fileId` or `fileIds` (1–10, purpose `CHAT_IMAGE`); `VOICE` → `fileId` (purpose `CHAT_VOICE`) + `durationSeconds`. Always `clientMessageId` + `type`. Unknown fields → `400` |
| Optional query params were sent empty (`?status=&q=`) | Unused params are now disabled in Postman. **Leave a param out** when you don't use it; an empty value can fail validation |
| SSE streams (discovery, auto-matching, venues, reply suggestions, verification) had made-up events and 404s | Rewritten from live streams. Venue stream: unnamed messages, the type is `data.event` (`queued`, `venues`, `completed`, `failed`). Reply stream: `snapshot` + `completed`, suggestions are `{ id, text }` objects. Discovery/auto-matching: `snapshot`, `progress`, `completed`/`failed`, `ping` every 15 s; unknown run → `DISCOVERY_RUN_NOT_FOUND`. **Unknown id on a stream:** always a normal JSON error before the stream opens (see "Changes from follow-up backend fixes") |
| Socket.IO: `notification:new` missing; `date:awaiting_confirmation` / `date:confirmed` shown wrapped | `notification:new` added (payload = one inbox item). Both date events are **flat** objects (`datePlanId`, `matchId`, `conversationId`, `status`, plus `confirmedByMe`, `attended`, `bothConfirmed` on `date:confirmed`). `date:postpone_requested` carries `reason`; `message:new` carries `isEdited`, `editedAt`, `isDeleted`, `deletedAt` |

Three examples described errors that can't happen and were removed: `GET /discovery/runs/current` never returns 404 (no run = `data: null`), unbanning a user who isn't banned succeeds, and face verification takes no image URL.

## Checklist

- [ ] Story cards: use `imageWidth` / `imageHeight` when present, fallback when `null`.
- [ ] Web push: register with `platform: "WEB"` and the Firebase JS SDK token.
- [ ] Match cards: show `lastMessagePreview` (when null, show your "say hi" text).
- [ ] Location refresh (`PATCH /users/me/location`): leave out `city` when you don't have one.
- [ ] Date planner: "plan somewhere else" = map place sent as a custom venue (B1).
- [ ] OTP screen: countdown from `error.details.retryAfterSeconds`.
- [ ] Stories: read `likesCount` from both like endpoints.
- [ ] Postman corrections: story photos use `mainPhotoUrl`; errors read top-level `message` + `error.code`; any 2xx is success.
- [ ] Validation errors: `error.details` items have `message` only, no `field`.
- [ ] Leave unused query params out instead of sending them empty.
- [ ] Socket.IO: listen to `notification:new`; parse the date events as flat objects.
- [ ] Likes received → match: show the match popup only when `data.match` is not null.
- [ ] Auto-matching: read `partnerNickname`; in the SSE `completed` event read `matches` (list) and `matchesCreated` (count).
- [ ] SSE: an unknown id is a normal JSON 404 before the stream opens.
- [ ] Link phone: offer it only when the account has no phone; handle `409 PHONE_ALREADY_SET`.
- [ ] After onboarding: edit the profile with `PATCH /users/me` (not onboarding steps); handle `409 ONBOARDING_COMPLETED`.
- [ ] Skipping an onboarding step: send `skip: true` (not `skipped`).
- [ ] Date planner: show no stars when `venueRating` is `null` (custom venues).
- [ ] No internal ids: chat uses `isMine` / `senderNickname` (no `senderId`); ratings use `reviewedNickname`; drop any use of `userId`, `reporterId`, `reportedUserId`, `proposerId`, `receiverId`.

## Prompts for your AI coding agent (copy-paste)

The same two prompts are hidden at the top of this file (an AI agent reading the file finds them automatically) and shown here so you can copy them. Both copies are identical. Paste the one for your app into your coding agent together with this file and the three Postman files. The agent **only checks and reports**; it changes nothing until you decide what to fix.

### Web user app

```text
You are auditing the 48Date WEB USER APP (the browser app for end users, not the admin panel).
Web specifics to check as well: B3 browser push (Firebase JS SDK `getToken(messaging, { vapidKey })`, then `PUT /users/me/push-token` with `platform: "WEB"`; token string only, not a Web Push subscription object); CORS-readable `Retry-After` is optional, the body field `error.details.retryAfterSeconds` is the one to use; cross-tab refresh lock (Web Locks or BroadcastChannel).

INPUTS (shared with this file):
- `48Date-Backend.postman_collection.json`: the REST API. Use only the `User` folder (the `Admin` folder belongs to the admin panel, ignore it).
- `48Date-WebSockets.postman_collection.json`: the Socket.IO events (client emits and server broadcasts).
- `48Date-Dokploy-Staging.postman_environment.json`: staging base URL and variables.
- This guide: the backend changes of 2026-11-20 (sections B1 to B9), "Changes from follow-up backend fixes" (including the 2026-11-21 sections "Date planner: venue distance and custom venue rating" and "No internal user ids in any response"), and "Postman corrections".
The Postman collections were audited against the backend code and live responses on 2026-11-20 and updated on 2026-11-21. Treat them as the contract. Every response is `{ success, message, data, meta? }` on success and `{ success: false, message, error: { code, details? } }` on error.

YOUR JOB: a complete, read-only audit of this app against the Postman contract. You do NOT fix anything.

HARD RULES
1. Do not modify, refactor, format or delete any app code, config, dependency or test. The only file you may create or edit is the audit document described below.
2. Do not start fixing after the audit, not even "small" or "obvious" fixes. Fixing starts only after the developer reviews the audit and tells you, item by item, what to fix.
3. Evidence only. Every finding cites the app file and line (`path:line`) and the Postman request name (e.g. `User / 04 - Matches / 01 Get Matches List`) or socket event. If you are not sure, re-read both sides; if still unsure, list it under "Needs confirmation", never as a finding.
4. No assumptions about backend behaviour beyond Postman and this guide. If Postman and this guide disagree, record it under "Questions for the backend".

WHAT TO CHECK, for every request in the `User` folder and every socket event:
a. Is it used? Find every place the app calls it. List requests/events the app never uses and say whether a screen should be using it (missing feature) or it is genuinely not needed.
b. Request: HTTP method, path, path params (the app uses nicknames, never internal user ids), auth header (`Authorization: Bearer <accessToken>`), body field names and casing, required vs optional, allowed values (case-sensitive enums), types, and fields the app sends that Postman does not list (the backend rejects unknown fields with 400).
c. Query params: filters, search, sorting, and the right pagination style for that endpoint (`cursor`+`limit` feeds vs `page`+`limit` lists), and that the app reads `meta` to load more.
d. Response parsing: the envelope; every field the app reads exists with that exact name, type and nullability in the saved success examples; nested objects (`otherUser`, `counterpart`, `latestDate`, `author`, `partner`…); fields the app ignores but should show.
e. Status codes: any 2xx is success (POST actions return 201, some 200, run starts 202). Flag code that requires exactly 200.
f. Errors: the app shows top-level `message` and branches on `error.code`; handles every error example saved for that request (401 session expired → refresh flow, 403, 404, 409, 429 with `error.details.retryAfterSeconds`); no code that reads `error.message`, `statusCode` or a `messages` array.
g. Auth and session: sign-in flows, token storage, one refresh at a time (see `2026-11-18-frontend.md`), `REFRESH_TOKEN_REUSED`/`REFRESH_TOKEN_INVALID` → sign-in.
h. Socket.IO: connection auth, rooms joined, every server event the app should listen to (incl. `notification:new`, all `date:*`, `message:*`, `conversation:*`, `game:*`, `typing`), payload field names (flat objects, not wrapped), and client emits.
i. The B1–B9 changes, "Changes from follow-up backend fixes" and "Postman corrections" in this guide: verify each one specifically.
j. Calls the app makes that are not in Postman at all (dead or removed endpoints).
k. Internal user ids: the app must never read or send internal user ids. Flag any code that reads `senderId`, `userId`, `reporterId`, `reportedUserId`, `reviewerId`, `reviewedUserId`, `proposerId`, `receiverId` or `partnerId` from a response (removed on 2026-11-21; see "No internal user ids in any response"), and any code that decides "my message or theirs" by comparing ids instead of `isMine`.

AUDIT DOCUMENT
Create `docs/api-audit/2026-11-21-postman-audit.md` (or, if the project already has a docs folder or a decisions/issues log, put it there and link it from that log). Structure:
1. Summary: date, app commit/branch audited, counts by severity, the 5 most important findings.
2. Findings table: `ID | Severity (Critical/High/Medium/Low) | Area / screen | Postman request or event | App location (path:line) | What the app does | What Postman says | Suggested fix | Decision needed`.
   - Critical: breaks a feature or loses data (wrong path/field, rejected body, crash on a response).
   - High: wrong behaviour visible to users (wrong field shown, missing error handling, wrong pagination).
   - Medium: fragile or incomplete (hard-coded 200, missing optional field, unused useful endpoint).
   - Low: cosmetic or cleanup.
3. Not used by the app: each unused request/event, and whether it should be.
4. Needs confirmation: items you could not prove either way.
5. Questions for the backend: where Postman or this guide looked wrong or unclear.
6. Decisions log: one line per finding with `Status: OPEN` for the developer to fill in (FIX / WON'T FIX / LATER).
Before saving, re-check every finding against the Postman example once more and remove anything you cannot prove.

WHEN YOU FINISH
Reply to the developer with: where the audit document is, the counts by severity, the top 5 findings in one line each, and the list of decisions you need. Then stop and wait. Remind the developer that nothing has been changed and that each finding needs a FIX / WON'T FIX / LATER decision before you touch any code.
```

### Flutter app

```text
You are auditing the 48Date FLUTTER APP (iOS/Android end-user app).
Flutter specifics to check as well: JSON models/serializers (field names, nullable types such as `String?`/`int?`, tolerance of extra fields, enums parsed case-sensitively with an unknown fallback); the HTTP client/interceptors (any 2xx = success, 401 → single-flight refresh); push token registration keeps `platform: "IOS"`/`"ANDROID"` (`"WEB"` is only for a browser build); PATCH `/users/me/location` must leave `city` out instead of serializing `null`.

INPUTS (shared with this file):
- `48Date-Backend.postman_collection.json`: the REST API. Use only the `User` folder (the `Admin` folder belongs to the admin panel, ignore it).
- `48Date-WebSockets.postman_collection.json`: the Socket.IO events (client emits and server broadcasts).
- `48Date-Dokploy-Staging.postman_environment.json`: staging base URL and variables.
- This guide: the backend changes of 2026-11-20 (sections B1 to B9), "Changes from follow-up backend fixes" (including the 2026-11-21 sections "Date planner: venue distance and custom venue rating" and "No internal user ids in any response"), and "Postman corrections".
The Postman collections were audited against the backend code and live responses on 2026-11-20 and updated on 2026-11-21. Treat them as the contract. Every response is `{ success, message, data, meta? }` on success and `{ success: false, message, error: { code, details? } }` on error.

YOUR JOB: a complete, read-only audit of this app against the Postman contract. You do NOT fix anything.

HARD RULES
1. Do not modify, refactor, format or delete any app code, config, dependency or test. The only file you may create or edit is the audit document described below.
2. Do not start fixing after the audit, not even "small" or "obvious" fixes. Fixing starts only after the developer reviews the audit and tells you, item by item, what to fix.
3. Evidence only. Every finding cites the app file and line (`path:line`) and the Postman request name (e.g. `User / 04 - Matches / 01 Get Matches List`) or socket event. If you are not sure, re-read both sides; if still unsure, list it under "Needs confirmation", never as a finding.
4. No assumptions about backend behaviour beyond Postman and this guide. If Postman and this guide disagree, record it under "Questions for the backend".

WHAT TO CHECK, for every request in the `User` folder and every socket event:
a. Is it used? Find every place the app calls it. List requests/events the app never uses and say whether a screen should be using it (missing feature) or it is genuinely not needed.
b. Request: HTTP method, path, path params (the app uses nicknames, never internal user ids), auth header (`Authorization: Bearer <accessToken>`), body field names and casing, required vs optional, allowed values (case-sensitive enums), types, and fields the app sends that Postman does not list (the backend rejects unknown fields with 400).
c. Query params: filters, search, sorting, and the right pagination style for that endpoint (`cursor`+`limit` feeds vs `page`+`limit` lists), and that the app reads `meta` to load more.
d. Response parsing: the envelope; every field the app reads exists with that exact name, type and nullability in the saved success examples; nested objects (`otherUser`, `counterpart`, `latestDate`, `author`, `partner`…); fields the app ignores but should show.
e. Status codes: any 2xx is success (POST actions return 201, some 200, run starts 202). Flag code that requires exactly 200.
f. Errors: the app shows top-level `message` and branches on `error.code`; handles every error example saved for that request (401 session expired → refresh flow, 403, 404, 409, 429 with `error.details.retryAfterSeconds`); no code that reads `error.message`, `statusCode` or a `messages` array.
g. Auth and session: sign-in flows, token storage, one refresh at a time (see `2026-11-18-frontend.md`), `REFRESH_TOKEN_REUSED`/`REFRESH_TOKEN_INVALID` → sign-in.
h. Socket.IO: connection auth, rooms joined, every server event the app should listen to (incl. `notification:new`, all `date:*`, `message:*`, `conversation:*`, `game:*`, `typing`), payload field names (flat objects, not wrapped), and client emits.
i. The B1–B9 changes, "Changes from follow-up backend fixes" and "Postman corrections" in this guide: verify each one specifically.
j. Calls the app makes that are not in Postman at all (dead or removed endpoints).
k. Internal user ids: the app must never read or send internal user ids. Flag any code that reads `senderId`, `userId`, `reporterId`, `reportedUserId`, `reviewerId`, `reviewedUserId`, `proposerId`, `receiverId` or `partnerId` from a response (removed on 2026-11-21; see "No internal user ids in any response"), and any code that decides "my message or theirs" by comparing ids instead of `isMine`.

AUDIT DOCUMENT
Create `docs/api-audit/2026-11-21-postman-audit.md` (or, if the project already has a docs folder or a decisions/issues log, put it there and link it from that log). Structure:
1. Summary: date, app commit/branch audited, counts by severity, the 5 most important findings.
2. Findings table: `ID | Severity (Critical/High/Medium/Low) | Area / screen | Postman request or event | App location (path:line) | What the app does | What Postman says | Suggested fix | Decision needed`.
   - Critical: breaks a feature or loses data (wrong path/field, rejected body, crash on a response).
   - High: wrong behaviour visible to users (wrong field shown, missing error handling, wrong pagination).
   - Medium: fragile or incomplete (hard-coded 200, missing optional field, unused useful endpoint).
   - Low: cosmetic or cleanup.
3. Not used by the app: each unused request/event, and whether it should be.
4. Needs confirmation: items you could not prove either way.
5. Questions for the backend: where Postman or this guide looked wrong or unclear.
6. Decisions log: one line per finding with `Status: OPEN` for the developer to fill in (FIX / WON'T FIX / LATER).
Before saving, re-check every finding against the Postman example once more and remove anything you cannot prove.

WHEN YOU FINISH
Reply to the developer with: where the audit document is, the counts by severity, the top 5 findings in one line each, and the list of decisions you need. Then stop and wait. Remind the developer that nothing has been changed and that each finding needs a FIX / WON'T FIX / LATER decision before you touch any code.
```
