@AGENTS.md

All project rules, the Pieces registry and design decisions live in AGENTS.md. Add new lasting rules there (rule 30), not here.
Most-missed rules: path routing, never `#hash` (rule 31); flow states stay on their step URL (rule 32); auth screens only talk to `authService` (rule 33); onboarding only talks to `onboardingService` and the profile draft (rule 34) and builds each step from `SetupShell` + `SetupStep` with targets from `data/onboarding/flow.ts` (rule 35); the verification camera opens only on click and is always released (rule 36); pieces live in a folder per kind and hooks in `src/hooks` (rule 7); profile / settings / membership only talk to `accountService` / `membershipService` (rules 39–40); server data is read with `useLoaded(screenKeys…)` on TanStack Query, never effect + state, and live data comes from SSE / the socket, not polling (rules 42–43).

## Frontend Responsiveness, Image, Navigation and QA Standards
The binding text is AGENTS.md rules 46–59. In short:
- every page works at 50 %–400 % browser zoom, with no horizontal overflow and no unintended empty bands (46–48);
- each page's primary action stays reachable, even in a 225 px-tall viewport (49);
- uploaded photos keep their own ratio through `MediaFrame`, and portraits are never stretched (50);
- Back is history-aware through `src/lib/navigation/` + `PortalBack`, with the data `to` as the fallback for direct entry, and context is preserved (51–53);
- screens show only API data, and backend gaps go to the QA report (54);
- the date-planning area never touches the profile location (55);
- existing tests are never changed, new tests come with every fix, and test / lint / build plus the zoom and back checks run before a phase is done (56–57);
- every phase updates `NEW_FRONTEND_QA_REPORT.md` (58).
- no empty space anywhere at any zoom: zooming out scales the whole page as one piece (`fit-portal` / `fit-landing`, heights via `var(--svh)`), short pages stretch to the bottom, and zooming in leads with the page's main thing (`usePrimaryInView`, `layout.stickyActions`) (59).
The phase plan is in `NEW_FRONTEND_IMPROVEMENT_ROADMAP.txt`.
