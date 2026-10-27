@AGENTS.md

All project rules, the Pieces registry and design decisions live in AGENTS.md. Add new lasting rules there (rule 30), not here.
Most-missed rules: path routing, never `#hash` (rule 31); flow states stay on their step URL (rule 32); auth screens only talk to `authService` (rule 33); onboarding only talks to `onboardingService` and the profile draft (rule 34) and builds each step from `SetupShell` + `SetupStep` with targets from `data/onboarding/flow.ts` (rule 35); the verification camera opens only on click and is always released (rule 36); pieces live in a folder per kind and hooks in `src/hooks` (rule 7); profile / settings / membership only talk to `accountService` / `membershipService` (rules 39–40).
