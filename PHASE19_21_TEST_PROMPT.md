Understood! All browser actions have been cleanly stopped right where we were, with the area selection dialog in an active, stable state on /dates/venues/sadia_rahman.

Below is the summary of what was completed and the detailed checklist of remaining tests. When you turn your laptop back on and are ready, simply paste or message this prompt back to resume immediately.

What Has Been Completed & Verified in this Session

Step 0 — Right-Side Blank Band Check (PASSED)

Viewport emulation override was completely cleared.
Tested 5 key portal routes at 100% in a maximized 1920×1080 window (/chats, /discover, /matches, /dates/venues/sadia_rahman, /settings).
clientWidth = 1905px, innerWidth = 1920px (accounting for the standard 15px Windows scrollbar), headerWidth = 1905px across all 5 pages.
Headers and content extend fully to the right edge with no blank white bands.
Conclusively proves that the white band seen previously was caused by leftover viewport emulation (Emulation.setDeviceMetricsOverride), not a CSS gap.

Account Setup & Baseline Location

Signed in as M1 Omar Farooq (+8801811000401).
Verified M1's baseline profile location in /settings/location: Gulshan, Dhaka.

Step 4.1 Date Area Isolation (Initial Checks PASSED)

Navigated to /dates/venues/sadia_rahman.
Changed area to Banani, Dhaka:
Line updated to "Area: Banani, Dhaka".
Cards recalculated distances from Banani (1.9 km, 2.1 km, 2.3 km, 2.8 km, 3.1 km, 3.7 km) correctly sorted nearest first.
Single venue-suggestions run cached (no duplicate POST /matches/:id/venue-suggestions).
No PATCH /users/me/location or /onboarding/location navigation occurred; M1's profile location remained strictly Gulshan.
Detailed Checklist of Remaining Tests (Ready to Resume)

Step 4.1 Continued (Area Selection & Profile Isolation)

Complete selection for "Uttara" (currently typed in dialog).
Test "Use my current location" (allow, then deny on 2nd try → verify denied note shows).
Test "Use the area around both of you".
Test "Chattogram" (far away area) → verify VENUES-EMPTY state renders with "No suggested public places are within 15 km of Chattogram." and "Change area" / "Try again" buttons.
Area persistence check: Banani → View place → Back → VENUES still says Banani → Choose this place → TIME → REVIEW shows "Area: Banani, Dhaka".
Re-check GET /users/me to confirm profile location remained Gulshan throughout.

Step 1: Real Zoom Matrix across Date Planning Routes (50% to 400% on 1440×900 + 1920×1080 spot checks)

Check horizontal overflow (scrollWidth <= clientWidth), grey bands, clipping, and primary action visibility across:
A: VENUES (/dates/venues/<p>) — View place, bottom row button, Change area. Map and list side-by-side at ≥1024px, stacked below 1024px; photo stacks on top at 360px.
B: VENUES-AREA dialog — Dialog body scrolls, action buttons visible at 360×225.
C: VENUES-EMPTY — Change area and Try again.
D: VENUE-DETAIL (/dates/place/<p>) — "Choose this place".
E: DATE-TIME (/dates/time/<p>) — "Review invitation".
F: DATE-PICKER dialog — "Use selected date", calendar grid usable at 360×225.
G: TIME-PICKER dialog — Time list scrolls, "Use {time}" visible.
H: DATE-REVIEW (/dates/review/<p>) — "Send invitation".
I: DATE-PENDING (/dates/plan/<p>) — "Change invitation".
J: Received invitation (Partner's context) — "Accept invitation".
K: DATE-CONFIRMED — Details card first, "Change or cancel".
L: DATE-MANAGE + DATE-CANCEL + SELECT-CANCEL — Reason list scrolls, dialog actions visible.
M: DATE-COMPLETE (/dates/complete/<p>) — "Keep the conversation going" / "Share your story".
N: FEEDBACK / FEEDBACK-DONE (/dates/feedback/<p>) — "Submit feedback".

Step 2: First-Screen Fit (Rule 60)

Check 100% desktop fit at 1440×900, 1280×800, 1366×768, and 1920×1080 for routes A, D, E, H, I, K, M.
Take and save the 1440×900 screenshots.

Step 3: In-App Back Navigation

Conversation → "+" → Plan date → VENUES → Back = same conversation.
VENUES → View place → Back = VENUES (same area line and scroll position).
Matches → View match details → Plan a date → Back = match details.
Place → Choose this place → TIME → Back = place. REVIEW → Back = TIME (retains day, time, timezone).
REVIEW → Send invitation → plan page → browser Back does not re-show review.
Confirmed → Change or cancel → Cancel date → browser Back does not reopen manage dialog.
Close area dialog (Escape, ✕) = stays on VENUES, focus returns to "Change area".
Direct entry fallbacks (/dates/place/<p> without place → VENUES; /dates/review/<p> without date → DATE-TIME; refresh on DATE-TIME preserves values).

Step 4.2 & 4.3: Date Window & Invitation Send

Date picker disables days >14 days ahead.
Today's date hides times <1 hour away.
Multi-account invitation send: M1 sends tomorrow 4:00 PM at suggested venue (POST /matches/:id/dates).
Partner receives invitation card in chat and on /dates/plan/m1.

Step 4.4: Live Updates (Socket Without Reload)

Partner accepts invitation → M1's open plan updates live to "Your date is set".
Reschedule / postpone flow: M1 suggests another time, partner chooses "Keep original time", M1 updates live.

Step 4.5 & 4.6: Hierarchy, Attendance & Completed Pair

Confirm details card is first card on DATE-CONFIRMED, DATE-MANAGE, DATE-REVIEW, DATE-COMPLETE.
Check attendance API status (SET / AWAITING_CONFIRMATION) or record blocker if none seeded.
Test "Skip feedback" on seed completed pair → sends no rating, opens DATE-COMPLETE, Back doesn't return to feedback.

Step 4.7 & 5: Offline State & Cleanup

Offline emulation on VENUES → Try again → verify error state, online recovers.
Cancel created test plan, verify profile locations remain untouched, clear viewport override.
Append finalized findings into NEW_FRONTEND_QA_REPORT.md.

Note: The recording of this session is available in the conversation artifacts. Whenever you are back, just say to continue and we will resume immediately from step 4.1! Have a good break!

# Browser test prompt: Phases 19–21 (games, stories feed, story details)

You are a QA tester on the 48Date **web frontend**. The code for Phases 19–21 is written and its unit and contract tests pass. Your job is the **browser checks only**. Do **not** change code, tests, or backend data beyond what each step says. Write every result, with numbers, into `NEW_FRONTEND_QA_REPORT.md`, under "Phases 19–21: games, stories feed, story details", as a new subsection "Browser results (Antigravity)". Never put OTPs, tokens or session data in screenshots or the report.

## Setup

- **Frontend:** `npm run dev -- -p 3001` (the backend owns port 3000). Use the owner's running dev port if one is already up.
- **Sign-in:** phone number, then the test OTP shown under the code field. Never guess OTPs.
- **Browser contexts:** one isolated context per account. Never sign the same account in twice; the backend revokes every session on refresh-token reuse.
- **Accounts:**
  - M1 `+8801811000401` omar_farooq
  - M2 `+8801811000402` rohan_sen
  - F1 `+8801811000301` hannah_brooks
  - F5 `+8801811000305` rupa_chakma
  - F6 `+8801811000306` tasneem_c
- **Seed data:** every male has a COMPLETED date with every female, so stories can be created for those pairs (Phase 22 screen `/stories/new`) if the feed is empty.
- **Step 0, first:** clear any viewport emulation left by earlier runs: CDP `Emulation.clearDeviceMetricsOverride`, or turn off DevTools device mode, or use a fresh window.
  - At 100 % in a maximised window, `document.documentElement.clientWidth` must equal the window's inner width.
  - Run the same check again after any emulated test.
  - A white band on the right with the override cleared is a real bug: report it with the URL and the sizes.

## Step 1: the zoom matrix (rule 46): real browser zoom, Ctrl + / Ctrl −

1. **Window 1440×900.** Test levels: 50, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300, 350 and 400 %.
2. **Window 1920×1080:** spot-check 50, 200 and 400 %.
3. **Viewport widths:** also check 360, 390, 768, 1024, 1280, 1440 and 1920 px.
4. **If only emulation is possible:** use these CSS viewports with `deviceScaleFactor` = the zoom, write "emulated", and clear the override afterwards.

   | Zoom | CSS viewport |
   |---|---|
   | 50 % | 2880×1800 |
   | 75 % | 1920×1200 |
   | 90 % | 1600×1000 |
   | 100 % | 1440×900 |
   | 110 % | 1309×818 |
   | 125 % | 1152×720 |
   | 150 % | 960×600 |
   | 175 % | 823×514 |
   | 200 % | 720×450 |
   | 250 % | 576×360 |
   | 300 % | 480×300 |
   | 350 % | 411×257 |
   | 400 % | 360×225 |

**For every state below and every level, record:**
1. `document.documentElement.scrollWidth > clientWidth` (must be **false**).
2. Empty bands left, right or below (none allowed, except the designed grey gutter). At 50–90 % the page must look like the 1440 design, larger.
3. Clipped, overlapping or truncated text, buttons or badges.
4. Whether the primary action is visible, or reachable by scrolling, and not covered by the header or the phone tab bar.
5. That the focus ring is visible and Tab order is logical.

**States** (`<p>` = the partner's nickname, `<id>` = a story id):

| # | State | How to reach | Primary action | Also check |
|---|---|---|---|---|
| A | GAMES `/games/<p>` | Conversation → "+" menu → Play game | "Start" | Art keeps 856:515, contained; a Back row is present |
| B | GAME-QUESTION | A → Start | "Next question" | Choices side by side when wide, **stacked** at 360px; pictures 169:120, not stretched at 360 or 2880 px; below 1024px the button row pinned above the tab bar |
| C | GAME-WAIT | B → pick → Next | "Next question" (disabled until the partner answers) | — |
| D | GAME-RESULT | All ten rounds | "Back to chat" | "{n} answers in common" |
| E | GAME-LEAVE dialog | B → Leave game (or Back) | Both buttons visible at 360×225; the body scrolls | — |
| F | STORIES `/stories` | Header Stories | **"Share your story"** | Must be visible at **every** level: in the header below 1280px, in the right panel from 1280. Record yes / no per level. Grid: 1 column at 360, 2 in the 1440 frame, no bands at 50 %. Photos uncropped at their own ratio, height capped. |
| G | STORY-DETAIL `/stories/story/<id>` | F → Read their story | "Add comment" | Photo uncropped, capped below half the screen; the comment field and "Add comment" reachable at 400 % |
| H | Delete-comment dialog | G → Delete on your own comment | Both buttons visible at 360×225 | — |
| I | Unavailable story | `/stories/story/does-not-exist` | "Back to stories" | — |

**Report:** one matrix table per state.

## Step 2: first-screen fit (rule 60)

At 100 % in 1440×900, 1280×800, 1366×768 and 1920×1080 windows, screenshot A, B, D, F and G. For each, record whether the primary composition and its primary action fit without scrolling, and whether the type is the Figma size. Attach the 1440×900 screenshots.

## Step 3: images (rule 50)

1. Create or find stories with photos of each ratio: 16:9, 9:16, 4:3, 3:4, 1:1 and 21:9. Uploading on `/stories/new` is Phase 22's screen and needs a completed date: use M1 with F1, F5, F6 and so on.
2. Confirm that on F (feed card) and G (detail) each photo shows **whole**:
   - nothing cropped or stretched;
   - 9:16 is narrower and height-capped, 21:9 is wide;
   - on load the frame changes from the 4:3 placeholder to the photo's ratio.
3. Note any photo that shows cropped.
4. Avatars are 1:1.

## Step 4: Back navigation (rules 51–53)

Use the in-app Back unless the step says otherwise. Record each check as path → expected → actual.

1. Conversation → "+" → Play game → GAMES → **Back** = the same conversation (not INBOX).
2. MSG-01 "Play game" → GAMES → **Back** = the conversation.
3. During a question or wait, **Back** opens GAME-LEAVE.
4. After GAME-RESULT, **Back** = the conversation.
5. Reload mid-game → Start → it resumes at the first unanswered question.
6. Stories → scroll down → Read their story → **Back** = Stories, at the same scroll position, with loaded pages kept.
7. Notifications → a story notification → **Back** = Notifications.
8. Story → Report story → **Back** = the story.
9. Direct entry to `/stories` works. Direct entry to an unknown story shows I.

## Step 5: functional and API checks (network tab: method, path, status; no tokens)

1. **Live game (M1 and F5, two contexts):**
   - M1 starts a game from their conversation (`POST /conversations/:id/games`); the invitation shows in both chats.
   - Both answer. Each of F5's answers enables M1's Next on GAME-WAIT **without a reload** (socket `game:answer`).
   - The result counts the answers in common the same on both screens.
   - Optionally: F5 leaves → M1 sees GAME-LEFT.
2. **Feed paging:** with more than 20 stories, "Show more stories" loads the next page (`GET /success-stories?cursor=…`). With none, the empty line shows. Offline → the load-failed state with Retry.
3. **Likes (M1 likes F5's approved story):**
   - Like → `POST /success-stories/:id/like`, and the count +1 from the response.
   - Like again (now "Liked") → `DELETE /success-stories/:id/like`, and the count goes back.
   - Reload F5's view: the count matches.
4. **Comments:**
   - F6 comments on M1's story → `POST …/comments` → COMMENT-SENT.
   - M1 opens the story and sees F6's comment under F6's nickname.
   - F6's own comment reads "You" with Delete → confirm → `DELETE …/comments/:commentId` → gone for both after a reload.
   - Long words and URLs wrap.
   - With more than 20 comments, "Show earlier comments" loads more with no duplicates.
   - Offline post → an error note, and the typed text stays.
5. **Consent view:** if a story is waiting for your approval (`PENDING_PARTNER`, you are the partner), it shows Approve / Don't share. Don't press them unless the data is yours to change.

## Report format

- **Method:** real or emulated; browser version; window sizes.
- **Step 0:** the width check results.
- **Step 1:** the matrix tables.
- **Step 2:** the first-screen table and screenshots.
- **Step 3:** the image ratio table.
- **Step 4:** the Back table.
- **Step 5:** results with network evidence.
- **Bugs:** for each one, the URL, zoom / viewport, steps, expected, actual and a screenshot. Mark each **frontend** or **backend**. For backend bugs, give the endpoint, the observed response and the expected response.
