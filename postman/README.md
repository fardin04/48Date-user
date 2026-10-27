# Postman collection

**Files:**

| File | What it is |
|---|---|
| `48Date-Backend.postman_collection.json` | The API, split **User** / **Admin** at the top (who calls it), then one folder per module inside each, numbered by build order (`01 - Auth`, `02 - Users`, …) |
| `48Date-WebSockets.postman_collection.json` | Dedicated WebSocket & real-time Socket.IO collection containing all client emit actions, server broadcasts, and rich payload variants (`TEXT`, `IMAGE`, `VOICE`, `GAME`, `DATE`, `SYSTEM`). |
| `48Date-Backend.postman_environment.json` | `baseUrl` (defaults to local dev, `http://localhost:3000/api/v1`), `socketUrl` (`http://localhost:3000`) |

Import both into Postman, select the **48Date — Local** environment, and run requests **in numeric order within a module folder** (`01 ...`, `02 ...`, …) — the numbering *is* the dependency order, e.g. `01 Request Phone OTP` must run before `02 Verify Phone OTP`.

## How it's organized

- **Top level: `User` / `Admin`** — matches the two client apps (Flutter / Next.js), so each dev only ever opens their own folder.
- **Inside each: one folder per module**, named `NN - Module Name` to match `docs/design/architecture/NN-*.md` and the fixed build order in `docs/design/gap-analysis/GAP-ANALYSIS.md`. A module folder appears under `User`, `Admin`, or both, depending on which side it has endpoints for.
- **Requests are numbered in call order** (`01 Request Phone OTP`, `02 Verify Phone OTP`, …) — later requests in a flow depend on state set by earlier ones, same as the folder numbering.
- Admin requests rely on the `admin_session` httpOnly cookie, which Postman's cookie jar stores automatically after `Admin / 01 - Auth / 01 Login` (or `07 Accept Invitation`) succeeds — no manual copying, as long as cookies aren't cleared between requests.

## Variables, and why some are scripted

Collection variables (not environment) carry state between requests **only for fields that genuinely repeat across a flow** — a phone number typed once and reused, an OTP code read back from a response and reused a request later. Everything else stays a plain example value in the body.

| Variable | Set by | Used by |
|---|---|---|
| `{{phone}}` | you, once (defaults to the seeded demo number) | `01 Request Phone OTP`, `02 Verify Phone OTP`, `16 Send Test SMS` |
| `{{devOtp}}` | auto — `01 Request Phone OTP`'s test script, from `data.devOtp` | `02 Verify Phone OTP` |
| `{{linkPhone}}` | you, once | `09 Link Phone — Request OTP`, `10 Link Phone — Verify OTP` |
| `{{linkDevOtp}}` | auto — `09`'s test script | `10 Link Phone — Verify OTP` |
| `{{accessToken}}` / `{{refreshToken}}` | auto — `02 Verify Phone OTP`, `03 Google Sign-In`, `04 Refresh Token` | every bearer-auth User request |
| `{{adminEmail}}` / `{{adminPassword}}` | you, once (defaults match `.env`'s `SUPER_ADMIN_*`) | `Admin / 01 Login`, `04 Change My Password`, `05 Forgot Password` |
| `{{adminId}}` | auto — `11 Invite Admin`'s test script | `12 Update Admin`, `13 Resend Invite` |
| `{{adminSessionId}}` | auto — `08 List My Sessions`'s test script (first non-current session) | `09 Revoke One of My Sessions` |
| `{{uploadedFileId}}` / `{{uploadedFileUrl}}` | auto — `User / 02 - Users / 05 Central File Upload` | `23 Save Onboarding Step — Photos`, `25 Start Face Verification`, `30 Update My Photos` |
| `{{verificationId}}` | auto — `User / 02 - Users / 25 Start Face Verification` | `26 Get Verification Snapshot`, `27 Verification Events (SSE)`, Admin verification reviews |
| `{{matchingRunId}}` | auto — `User / 03 - Auto-Matching / 01 Start or Resume Auto-Matching Run` | `02 Get Auto-Matching Run Snapshot`, `03 Stream Auto-Matching Run Events` |
| `{{matchId}}` | you, once (or from match payload) | `User / 04 - Matches / 03 Mark Match Seen`, `04 Get Match Details`, `Admin / 04 - Matches / 03 Get Match Detail` |
| `{{discoveryRunId}}` | auto — `User / 05 - Discovery Runs / 03 Start or Resume Discovery Deck Run` | `05 Get Discovery Run Snapshot`, `06 Stream Discovery Run Events`, `User / 06 - Discovery Cards & Swipes / 01 Get Deck Cards` |
| `{{targetNickname}}` | auto / defaults to `Aura_Love99` | `User / 06 - Discovery Cards & Swipes / 03 Record Swipe`, `02 Get Discovery Profile Detail`, Admin users endpoints |
| `{{conversationId}}` | auto — `04 - Matches` or `07 - Chat / 01 Get Conversations List` | `User / 07 - Chat` endpoints (`02 Header`, `03 History`, `04 Send Message`, `05 Mark Seen`) |
| `{{datePlanId}}` | you, once (defaults to `date-plan-001`) | `User / 09 - Dates` endpoints |
| `{{dateRequestId}}` | you, once (defaults to `date-req-001`) | Date postpone accept, decline, withdraw |
| `{{venueRunId}}` | auto / defaults to `venue-run-001` | Venue suggestions snapshot, events SSE, and weather |
| `{{aiRequestId}}` | auto / defaults to `ai-req-001` | AI reply suggestions regenerate, snapshot, events SSE |
| `{{photoId}}` | you, once (defaults to `photo-uuid-001`) | `Admin / 02 - Users / 12 Toggle User Photo Visibility` |
| `{{exportId}}` | auto — `Admin / 04 - Matches / 04 Start CSV Export` | `05 Get Export Snapshot`, `06 Stream Export Events SSE` |

A request's own Description says which variables it reads/writes. Edit `{{phone}}`, `{{linkPhone}}`, `{{adminEmail}}`, `{{adminPassword}}` directly in the collection's variable list (or the environment) when you need different values; the rest fill themselves in as you run requests top to bottom.

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

Any change to an endpoint — new route, changed request/response shape, a new error code — is reflected here **in the same change** that touches the code, never caught up later. See the "Postman collection" rule in `AGENTS.md` for the full standard this collection follows. D-185 is worth re-reading once: it caught `GET /admin/admins` shipping with no pagination at all despite the convention already being final — a reminder that "document the list params" implies "the API actually has list params," not the other way around.
