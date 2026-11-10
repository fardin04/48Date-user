# Postman collection

**Files:**

| File | What it is |
|---|---|
| `48Date-Backend.postman_collection.json` | The API, split **User** / **Admin** at the top (who calls it), then one folder per module inside each, numbered by build order (`01 - Auth`, `02 - Users`, …) |
| `48Date-WebSockets.postman_collection.json` | Dedicated WebSocket & real-time Socket.IO collection containing all client emit actions, server broadcasts, and rich payload variants (`TEXT`, `IMAGE`, `VOICE`, `GAME`, `DATE`, `SYSTEM`). |
| `48Date-Backend.postman_environment.json` | **48Date — Local**: every variable both collections use for local development (`http://localhost:3000/api/v1`) |
| `48Date-Dokploy-Staging.postman_environment.json` | **48Date — Dokploy Staging**: configured for the live Dokploy deployment (`https://48date.tribecajetscommandcenter.com/api/v1`) |
| `tools/build-scripts.py` | Regenerates every capture script, the admin cookie header and the variable lists from one table. Run it after adding a request that produces an id: `python postman/tools/build-scripts.py` |
| `tools/check-scripts.mjs` | Runs every capture script against its request's saved success examples and fails if one throws or saves nothing: `node postman/tools/check-scripts.mjs` |

Import all three files into Postman, **select the 48Date — Local environment** (top-right), and run requests **in numeric order within a module folder** (`01 ...`, `02 ...`, …). The numbering is the dependency order: `01 Request Phone OTP` fills `{{devOtp}}`, `02 Verify Phone OTP` uses it and fills `{{accessToken}}`, and so on.

## How it's organized

- **Top level: `User` / `Admin`** — matches the two client apps (Flutter / Next.js), so each dev only ever opens their own folder.
- **Inside each: one folder per module**, named `NN - Module Name` to match `docs/design/architecture/NN-*.md` and the fixed build order in `docs/design/gap-analysis/GAP-ANALYSIS.md`. A module folder appears under `User`, `Admin`, or both, depending on which side it has endpoints for.
- **Requests are numbered in call order** (`01 Request Phone OTP`, `02 Verify Phone OTP`, …) — later requests in a flow depend on state set by earlier ones, same as the folder numbering.
- **User requests** send `Authorization: Bearer {{accessToken}}` (public ones like `Get Onboarding Options` or `Get Public Feed` send nothing).
- **Admin requests** send `Cookie: admin_session={{adminSession}}`. `Admin / 01 - Auth / 01 Login` (and `06 Reset Password`, `07 Accept Invitation`) captures the cookie into `{{adminSession}}` automatically, so admin requests work in the Postman app, in the Collection Runner and in Newman alike.

## Variables: what fills itself in

Every capture script saves to **both** the collection variables and the selected environment, so the WebSockets collection (which reads the same environment) gets the same `{{accessToken}}` and `{{conversationId}}`. Values only change after a **2xx** response, so a failed request never wipes a good value.

**You set these once** (defaults work with `npm run db:seed`): `{{phone}}` (seeded demo user), `{{linkPhone}}`, `{{adminEmail}}`, `{{adminPassword}}` (seeded super admin).

**Filled in automatically** — run the request on the left first:

| Run this | Fills |
|---|---|
| User / 01 Auth / `01 Request Phone OTP` | `devOtp` (only while `DEV_MODE=true` and Twilio isn't configured) |
| User / 01 Auth / `02 Verify Phone OTP`, `03 Google Sign-In`, `04 Refresh Token` | `accessToken`, `refreshToken` |
| User / 01 Auth / `09 Link Phone — Request OTP` | `linkDevOtp` |
| User / 02 Users / `02 Get Onboarding Options` | `interestId1`, `interestId2` (used by the interests step and discovery preferences) |
| User / 02 Users / `05 Central File Upload` | `uploadedFileId`, `uploadedFileUrl` (+ `storyImageUrl` when `purpose` is `STORY_IMAGE`) |
| User / 02 Users / `25 Start Face Verification` | `verificationId` |
| User / 03 Auto-Matching / `01 Start or Resume Auto-Matching Run` | `matchingRunId` |
| User / 04 Matches / `01 Get Matches List`, `02 Get Unseen Matches`, `04 Get Match Details` | `matchId`, `conversationId`, `targetNickname` (the other user) |
| User / 05 Discovery Runs / `03 Start or Resume…`, `04 Get Current Discovery Run` | `discoveryRunId` |
| User / 06 Cards & Swipes / `01 Get Deck Cards` | `targetNickname` (first card) |
| User / 06 Cards & Swipes / `03 Record Swipe` | `matchId`, `conversationId` (only when the like created a match) |
| User / 07 Chat / `01 Get Conversations List` | `conversationId` |
| User / 08 Games / `02 Start or Get Game` | `gameId`, `gameQuestionId` (question 1) |
| User / 08 Games / `04 Submit Game Answer` | `gameQuestionId` moves to the next question (answers are accepted in order), so just send it again |
| User / 09 Dates / `01 Start Venue Suggestions` | `venueRunId` |
| User / 09 Dates / `05 Send Date Invite`, `17 List My Dates` | `datePlanId` |
| User / 09 Dates / `10 Request Postpone` | `dateRequestId` |
| User / 10 AI / `02 Request Reply Suggestions`, `04 Request Match Opener` | `aiRequestId` |
| User / 11 Trust & Safety / `04 Submit Report` | `reportId` |
| User / 11 Trust & Safety / `08 Get Pending Warnings` | `warningId` |
| User / 12 Notifications / `01 Get Notifications Inbox` | `notificationId` |
| User / 13 Subscriptions / `01 Get Subscription Plans` | `planId` |
| User / 14 Stories / `01 Get Public Feed`, `05 Post Success Story` | `storyId` |
| User / 14 Stories / `04 Get Eligible Dates` | `storyDatePlanId` (a completed date, used by `05 Post Success Story`) |
| User / 14 Stories / `11 Get Story Comments`, `12 Add Comment` | `commentId` |
| Admin / 01 Auth / `01 Login`, `06 Reset Password`, `07 Accept Invitation` | `adminSession` (the session cookie) |
| Admin / 01 Auth / `08 List My Sessions`; Admin / 13 / `04 List My Active Sessions` | `adminSessionId` (a session other than the current one) |
| Admin / 01 Auth / `10 List Admins`, `11 Invite Admin` | `adminId` |
| Admin / 02 Users / `01 List Users` | `targetNickname`, `targetUserNickname` |
| Admin / 02 Users / `03 Get User Profile Drawer` | `photoId` (that user's first photo) |
| Admin / 02 Users / `08 List Verification Queue` | `verificationId` |
| Admin / 02 Users / `14 Start Users CSV Export` | `userExportId` |
| Admin / 04 Matches / `01 List Matches` · `04 Start CSV Export` | `matchId` · `exportId` |
| Admin / 06 Games / `01 List Game Questions`, `02 Create Game Question` | `adminQuestionId` |
| Admin / 09 Trust & Safety / `01 List Moderation Reports` | `reportId` |
| Admin / 09 Trust & Safety / `03 Get Report Detail` | `trustEventId` (first reversible penalty on the reported user) |
| Admin / 10 Notifications / `02 Create Broadcast Campaign` · `06 Get Admin Notifications Bell` | `broadcastId` · `adminNotificationId` |
| Admin / 11 Subscriptions / `01 List Subscription Plans` | `planId` |
| Admin / 12 Stories / `01 List Moderation Queue` | `storyId` |

**Still manual** (the value never appears in an API response):
- Google sign-in `idToken` — comes from the Google SDK on a device.
- Admin invite / password-reset `token` — printed in the server log while `DEV_MODE=true` (sent by email otherwise).
- Cursors (`{{discoveryCursor}}`, `{{chatCursor}}`, `{{messageCursor}}`, `{{cursor}}`) — leave empty for the first page; paste `meta.nextCursor` to fetch the next one.

## Reading a request (The 5 Mandatory Postman Standards)

1. **Payload inline comments & field descriptions:** Request bodies in Postman must include inline comments (`// comment`) at the end of each field line describing the field, format, and case-sensitive allowed values (never inside string quotes). In addition, all fields are documented directly in the request's Description under a dedicated `**Body fields:**` list (name, type, required/optional, format, case-sensitive allowed values).
2. **GET list endpoints must have query params:** Every GET list endpoint documents and implements query params for filter (`?status=`), search (`?q=`), pagination (`?page=&limit=` for admin tables; `?cursor=&limit=` for feeds), and sorting (`?sort=field:direction`). If an endpoint is unpaginated because it is small and bounded per-user (e.g. `08 List My Sessions`), it says so explicitly.
3. **Pagination information in responses:** Every paginated GET list endpoint returns full pagination metadata (`meta: { page, limit, total, totalPages }` on admin tables; `meta: { nextCursor, hasMore }` on feeds). Saved response examples must include this fully populated `meta` block.
4. **Param descriptions:** Path and query parameters use Postman's own param descriptions (the Params tab).
5. **Case-sensitive enums/selected data:** Whenever a parameter or JSON body field accepts a restricted set of values or enums, every allowed value is listed and is **case-sensitive** in the description.

Also:
- The **Description** states what the endpoint does, auth requirements, side effects, and variables read/written.
- **Saved examples for all realistic cases:** Every request has at least one saved success example and one saved error example per realistic failure, each with the **complete** response body.

## Keeping this in sync (D-183, refined D-185)

**Scripts:** never hand-edit a capture script in Postman. Add or change the row in `CAPTURES` in `tools/build-scripts.py`, run it, then run `tools/check-scripts.mjs`. The build script fails if a request uses a `{{variable}}` that isn't declared, or if a capture points at a request that no longer exists.


Any change to an endpoint — new route, changed request/response shape, a new error code — is reflected here **in the same change** that touches the code, never caught up later. See the "Postman collection" rule in `AGENTS.md` for the full standard this collection follows. D-185 is worth re-reading once: it caught `GET /admin/admins` shipping with no pagination at all despite the convention already being final — a reminder that "document the list params" implies "the API actually has list params," not the other way around.
