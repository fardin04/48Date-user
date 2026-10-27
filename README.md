# 48Date — user web portal (frontend)

48Date is a dating product built around one idea: **a mutual like opens a 48-hour window to agree on a real date.**
This repository is the **user web frontend**:
- the public landing and legal pages;
- sign-up / sign-in;
- the guided profile setup with identity verification;
- the signed-in member portal: discovery, matches, chats, date planning, icebreaker games, success stories, profile, settings, safety and membership.

It is **frontend only**. Every screen talks to a typed service whose current implementation is a clearly marked mock, so the real API can be plugged in later without touching components (see [Connecting the real API](#connecting-the-real-api)).

The design source is the Figma file `48Date` (`L4MtWjAVlPSRAjJSzI1lrf`), sections W00–W11. The project rules every change follows live in [AGENTS.md](AGENTS.md).

---

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [How the code is organised](#how-the-code-is-organised)
- [Pages and URLs](#pages-and-urls)
- [Trying the flows with the mocks](#trying-the-flows-with-the-mocks)
- [Connecting the real API](#connecting-the-real-api)
- [Responsive layout](#responsive-layout)
- [Security and privacy](#security-and-privacy)
- [Accessibility](#accessibility)
- [Quality checks](#quality-checks)
- [Conventions](#conventions)

---

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `cacheComponents` / Partial Prerendering, Turbopack) |
| UI | React 19 with the React Compiler |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, design tokens in `src/app/globals.css` |
| Primitives | Radix UI (Dialog, Accordion, Slot) wrapped as cleaned-up shadcn components |
| Font | Manrope via `next/font` |
| Icons | Hugeicons glyphs exported from Figma as SVG (`public/icons`) |

> Next.js 16 differs from older versions. Its bundled docs in `node_modules/next/dist/docs/` are the reference.

## Getting started

Requirements: **Node.js 20 or newer** (developed on Node 24) and npm.

```bash
npm install                  # install dependencies
cp .env.example .env.local   # optional until a real API exists
npm run dev                  # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start                # or: npx next start -p 3417
```

Sign in to reach the portal:
1. Open `/signin`.
2. Enter any valid phone number.
3. Enter any six-digit code except `000000` and `999999` (see [mocks](#trying-the-flows-with-the-mocks)).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build; prerenders every route (≈150 pages) and type-checks |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint (Next.js, React Compiler rules); must pass with no warnings |
| `npx tsc --noEmit` | Type-check only |
| `npm audit` | Dependency vulnerability check |

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the 48Date API, read only in `src/lib/api-config.ts`. Empty while the mocks are in use. |

`.env*` files are git-ignored except `.env.example`. Never commit secrets; the frontend holds none.

## Project structure

```
public/
  icons/            Hugeicons SVGs (one per slug), coloured with CSS masks
  images/           landing · onboarding · portal photos (WebP / PNG)
  brand/ badges/ flags/
src/
  app/              Routes only: layouts, metadata and route files
    [[...section]]/   Landing (sections are URL segments, e.g. /how-it-works)
    terms/ privacy/   Legal pages
    signup/ signin/   Authentication
    onboarding/       Guided profile setup (/onboarding/<step>)
    discover/ matches/ chats/ dates/ games/ stories/      Member portal
    profile/ settings/ notifications/ report/ membership/ Account, safety, Premium
  components/
    ui/             shadcn primitives (button, dialog, accordion)
    pieces/         Reusable, page-agnostic building blocks, by kind:
      actions/        buttons and links that carry a data Action
      brand/          the 48Date logo
      cards/          content cards and rows (match, plan, place, facts…)
      content/        Text, Icon, Chip, headings, rich text
      feedback/       status notes, badges, summaries, progress, countdown
      forms/          fields, choices, pickers, form header
      illustrations/  non-interactive landing art built in HTML
      layout/         Section, Container, PortalCard, Reveal…
      media/          avatars, photos, upload slots, map
      overlays/       PortalDialog
      shells/         page frames, headers, footers, session guard
    sections/       One file per Figma section or screen, composed from pieces
      landing/ legal/ auth/ onboarding/
      portal/
        shared/       workspace, status screen, route factory, guard, view switch
        discover/ matches/ chats/ dates/ games/ stories/
        profile/ settings/ membership/
  data/             All copy, image paths, icon names and actions (typed)
  stores/           The only way components read data/ (getLanding(), getPlans()…)
  hooks/            Shared React hooks (useLoaded, useNow, useMatchClock…)
  lib/
    routes.ts       Screen codes → URLs (hrefFor, to, toItem, notFunctional)
    type-scale.ts control-sizes.ts tones.ts   Design-token scale maps
    auth/ onboarding/ portal/   Typed services, each with a mocks/ folder
```

## How the code is organised

**Data → stores → components.**
- Copy, labels, image paths and actions live in `src/data`.
- Components read them through `src/stores/*` and never import `src/data` directly.
- No copy, hex value or pixel literal lives in a component.

**Design tokens.**
- Every colour, type style, radius and control size is a token in `src/app/globals.css`.
- Each token is registered in a scale map in `src/lib` (`type-scale.ts`, `control-sizes.ts`, `tones.ts`).
- Components pick variants (`variant`, `size`, `tone`) instead of raw classes.

**Screen codes are the navigation map.**
- Figma names each screen with a code (`DISCOVER`, `CHAT-01`, `PAY-REVIEW`…).
- `src/lib/routes.ts` maps codes to URLs, and every link is built with `hrefFor` / `to` / `toItem`.
- An action whose destination doesn't exist yet uses `notFunctional(reason)`. It renders as a disabled button carrying the reason.

**One URL per screen; Figma states are client states.**
- Error, empty, loading, success and dialog states of a step render on that step's URL (rule 32 in AGENTS.md). For example, PAY-PROVIDER, PAY-PROCESS and PAY-DONE all live on `/membership/checkout/<plan>`.
- Routing is path-based (never `#hash`).
- Every route prerenders through an optional catch-all segment.

**Services, not fetches, in components.**
- Each feature has a service contract in `src/lib/<feature>/*-service.ts` and a marked mock in its `mocks/` folder.
- Components call only the service, never `fetch` or storage directly.

**The portal frame.**
- Every portal page is `PortalShell`: the header, a session guard, and `PortalGuard` (offline / error screens).
- The page itself is a view chosen in `sections/portal/shared/portal-page.tsx`.
- Most screens use `Workspace`: a white panel plus the 352px "Flow support" column.
- State screens use `StatusScreen`.

## Pages and URLs

Run locally and open `http://localhost:3000` + the path. In the paths, `<member>` is a sample member id: `wildflower`, `goldenhour`, `wildrose`, `riverstone` or `northpeak`.

| Area | Paths |
| --- | --- |
| Landing | `/`, `/how-it-works` and other sections as segments |
| Legal | `/terms`, `/terms/<section>`, `/privacy`, `/privacy/<section>` |
| Sign up | `/signup`, `/signup/verify`, `/signup/verified`, `/signup/google`, `/signup/google/error` |
| Sign in | `/signin`, `/signin/verify`, `/signin/verified`, `/signin/google`, `/signin/google/error`, `/signin/session-ended` |
| Onboarding | `/onboarding/location`, `nickname`, `private-name`, `birthday`, `identity`, `lifestyle`, `details`, `interests`, `goals`, `personality`, `communication`, `photos`, `verify`, `notifications`, `ready` |
| Discover | `/discover`, `/discover/filters`, `/discover/profile/<member>`, `/discover/compatibility/<member>` |
| Matches | `/matches`, `/matches/cancelled`, `/matches/complete`, `/matches/match/<member>` |
| Chats | `/chats`, `/chats/<member>` |
| Dates | `/dates/venues/<member>`, `/dates/place/<member>`, `/dates/time/<member>`, `/dates/review/<member>`, `/dates/plan/<member>`, `/dates/manage/<member>`, `/dates/feedback/<member>`, `/dates/complete/<member>` |
| Games | `/games/<member>` |
| Stories | `/stories`, `/stories/story/first-coffee`, `/stories/new`, `/stories/mine` |
| Profile | `/profile`, `/profile/edit`, `/profile/photos`, `/profile/trust`, `/profile/trust/activity`, `/profile/trust/review` |
| Settings | `/settings`, `/settings/account`, `/settings/notifications`, `/settings/privacy`, `/settings/blocked`, `/settings/delete` |
| Notifications | `/notifications` |
| Safety | `/report`, `/report/<member>`, `/report/first-coffee` |
| Membership | `/membership`, `/membership/plans`, `/membership/checkout/<weekly\|monthly\|yearly>`, `/membership/restore`, `/membership/manage`, `/membership/limit` |

Unknown paths show the 404 page. Portal and onboarding pages send signed-out visitors to `/signin`; the sign-in / sign-up pages send signed-in members to `/discover`.

## Trying the flows with the mocks

All state lives in `sessionStorage` for the current tab (keys start with `48date.`) and is validated on read. Logging out clears it. Every mock is marked `MOCK` at the top of its file.

| Feature | Mock behaviour |
| --- | --- |
| Auth (`lib/auth/mocks`) | Any six-digit code verifies except `000000` (wrong code) and `999999` (expired); the fourth resend hits the limit. |
| Onboarding (`lib/onboarding/mocks`) | Nickname "GoldenHour" is taken. Area search uses a starter list. Uploads take ~2.5s and fail offline. A selfie is reviewed in ~6s; a very dark photo is sent back for a retry. |
| Discovery (`lib/portal/mocks/mock-portal-service.ts`) | Filters apply to the sample deck. A like on GoldenHour is mutual. Match deadlines count down from the first visit. |
| Chats | Messages fail while offline (retry / edit). Every third AI suggestion request fails. Blocking hides the conversation. |
| Dates | WildRose has invited you. RiverStone's date has passed and asks about attendance. A sent invitation is answered after ~6s. |
| Games / stories | The match answers after ~2.5s. A story containing an email or phone number is sent back by moderation. |
| Profile / settings | Saves validate like the server would and fail offline. Reports, reviews and deletion are accepted, not stored. |
| Membership | Everyone starts free with one new conversation a week; a second first-hello opens the limit screen. Paying takes ~3s and fails offline. Restore finds only a purchase made earlier in the tab. |

To see offline states, switch the browser to offline in DevTools. A page opened offline shows "You're offline". An action taken offline shows that screen's own failure state.

## Connecting the real API

Each service exports a contract (TypeScript type) and a single binding line:

```ts
// src/lib/portal/chat-service.ts
export const chatService: ChatService = mockChatService;
```

To go live:
1. Implement the contract against the API (base URL from `src/lib/api-config.ts`).
2. Change that one line. Components need no change.

| Service | File | Covers |
| --- | --- | --- |
| `authService` | `lib/auth/auth-service.ts` | Phone codes, Google, session, sign-out |
| `onboardingService` | `lib/onboarding/onboarding-service.ts` | Nickname check, area search, photo upload, selfie review |
| `portalService` | `lib/portal/portal-service.ts` | Preferences, discovery deck, decisions, matches and deadlines |
| `chatService` | `lib/portal/chat-service.ts` | Conversations, messages, AI suggestions, block / unblock |
| `dateService` | `lib/portal/date-service.ts` | Venues, date plans, invitations, attendance, feedback |
| `gameService` | `lib/portal/game-service.ts` | This-or-That rounds |
| `storyService` | `lib/portal/story-service.ts` | Stories, comments, submissions and moderation |
| `accountService` | `lib/portal/account-service.ts` | Profile, account details, photos, notification choices, trust reviews, reports, deletion |
| `membershipService` | `lib/portal/membership-service.ts` | Membership, hosted checkout result, restore, renewal, free quota |

Backend notes taken from the design handoff:
- **Match deadlines** (`expiresAt`) are server-owned; the client only counts down.
- **Entitlements** come only from verified billing-provider events. Checkout is the provider's hosted page; the app never handles card data.
- **The session** is a sessionStorage flag in the mock. A real API should use an httpOnly cookie.
- **Server validation** must reproduce the field rules in `lib/portal/account-rules.ts` and return field errors in the same shape.

## Responsive layout

- Desktop frames are 1440 px; tablet frames (W11) are 1024 px; the 768 header follows the "Web Header / Portrait" component.
- Every page is checked at 360, 390, 768, 1024, 1280, 1440 and 1920 px for horizontal scroll and a single `h1`.
- **1280 and up:** follows the desktop frames (80px gutters, three-column discovery, flow-support column).
- **1024–1279:**
  - 24px gutters, full nav labels, flow-support columns hidden.
  - Discovery shows the photo beside the details with "Adjust filters" in the heading.
  - Chat keeps the 280px list.
  - Match and plan cards stay three across.
- **640–1023:** the nav becomes 56px icon tiles; layouts stack where two columns no longer fit.
- **Below 640:** 16px gutters, bare nav icons, action rows stack full width, and flow-support cards sit below the content.

Every responsive decision is recorded under "Decisions" in [AGENTS.md](AGENTS.md).

## Security and privacy

- **No raw HTML:** no `dangerouslySetInnerHTML` with user content; React escapes every name, bio and message.
- **No secrets:** none in code; the API URL comes from an environment variable.
- **No tokens in `localStorage`:** sign-out clears every `48date.*` key and in-memory media.
- **Approximate location only:** other members' location is shown as an area and distance. Location permission keeps only an area label, never coordinates.
- **Uploads:** photos must be JPG / PNG / WebP up to 10 MB; previews are in-memory object URLs, revoked when discarded.
- **Camera and microphone:** open only on a click and are released when the screen is left.
- **Payments:** hosted checkout only; card fields are never rendered.
- **Safety:** reports are private, deletion requires confirmation, and phone numbers never appear on profiles, chats or matches.
- **Links:** there are no external or new-tab links yet; any future one must use `rel="noopener noreferrer"`. There are no redirect parameters, so no open redirects.
- **Dependencies:** `npm audit` reports 0 vulnerabilities.

## Accessibility

- **Structure:** landmarks (`header`, `nav`, `main`, `footer`) and exactly one `h1` per page.
- **Text alternatives:** alt text comes from data, and icon-only controls have labels.
- **Forms:** every field has a visible label, and errors are linked with `aria-describedby`.
- **Keyboard:** visible focus rings and full keyboard use (the swipe deck has buttons; dialogs trap focus and close on Escape).
- **Live regions:** status changes are announced through them; live countdowns are not announced every tick.
- **Motion:** reveals and accordions respect `prefers-reduced-motion`.

## Quality checks

Before calling work done:

```bash
npm run lint && npx tsc --noEmit && npm run build && npm audit
```

Then check the changed screens in the browser at the widths above and compare them with their Figma frames.

## Conventions

The full rule set, the **Pieces registry** (every reusable piece with its props) and the record of design decisions are in [AGENTS.md](AGENTS.md). In short:
- **Components:** one per file, kebab-case file names, named exports. Server Components by default; `"use client"` only on interactive leaves.
- **New pieces:** go in the `pieces/<kind>/` folder that matches what they are, and are added to the registry.
- **Variants:** visual differences are props (`variant`, `size`, `tone`); call sites pass `className` only for placement.
- **Duplication:** no duplicated markup or class strings; a pattern used twice becomes a piece or a shared constant.
- **Git:** never commit or push unless asked.
