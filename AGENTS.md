<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 48Date — project rules

48Date is a dating product built around one idea: **a mutual like opens a
48-hour window to agree on a real date.** This repo is its web app — the user
web portal first (Figma page `04 / User Web Portal`), the admin portal later
(`03 / Admin Final Design`). The phone layouts are on `02 / User Final Design`;
tokens and components on `01 / Design System`.

Figma file: `L4MtWjAVlPSRAjJSzI1lrf` (48Date).

These rules are binding. They are not suggestions, and they are not overridden
by "it's quicker this way". If a rule genuinely cannot be followed for a task,
say so explicitly instead of silently working around it.

## 0. The two rules that outrank everything

1. **Never write the same line of code twice.** If a block of markup, a class
   string, a handler, or a shape of data appears a second time anywhere, it
   becomes a reusable component, a shared constant, or a store selector —
   immediately, not "later". Duplication is a defect, not a style preference.
   48Date's design repeats itself on purpose (every state screen, every fact
   row, every pill action is the same piece) — build each piece once.
2. **Do not re-pass classes a component already applies.** A reusable component
   owns its default look. Call sites pass `className` only to add something
   genuinely per-instance (position, width in a specific layout). Never restate
   the defaults from outside, and never pass a class that fights one the
   component already sets — fix the component instead.

## 1. Read the design's own handoff before building a screen

Every web screen in Figma is a frame named `W / <CODE> / <Title>`
(`W / MATCH-EXPIRING / A little time. A real possibility.`), and beside it is a
developer-notes frame `D / web / <CODE>`. That notes frame is the spec:

| Line        | Means                                                                 |
| ----------- | --------------------------------------------------------------------- |
| `Purpose`   | What the screen is for — its body copy                                |
| `Entry`     | Which screens lead here — check those link to it                       |
| `Actions`   | `Label → CODE` — the exact destination of every button. Build them all |
| `Data / validation` | Fields, rules and error behaviour — goes into the Zod schema   |
| `Behavior`  | Product rules (the 48-hour clock, compatibility vs. trust) — rule 3    |
| `Reference` | The node id, and "1440 px desktop / 520 px modal"                     |

- Before writing a screen, read its `D / web / <CODE>` frame and call
  `get_design_context` on the `W / <CODE>` node itself, not a parent.
- An `Actions` target that isn't built yet still gets its button, wired with
  `notFunctional` (rule 9) — never dropped, never pointed somewhere else.
- The notes say "Sample content, not production records": names like
  GoldenHour, Wildflower, RiverStone are dummy data and live in `src/data`.

## 2. Screen codes are the navigation map

Screen codes (`DISCOVER`, `FILTERS`, `MATCHES`, `MATCH-NEW`, `COMPAT`,
`MSG-01`, `CHAT-01`, `VENUES`, `PERSONALITY`…) are how the design names
destinations, so they are how the code names them too.

- `src/data/screens/screens.data.js` is the one registry:
  `{ CODE: { href, kind } }` where `kind` is `"route"` (its own URL),
  `"state"` (a state of another route — `DISCOVER-EMPTY` is `/discover` with
  nothing left) or `"modal"` (a 520px dialog over its parent).
- Every action in a data file names its destination by **code**
  (`{ label: "Say hello", to: "MSG-01" }`); `hrefFor(code, values)` in
  `src/lib/screens.js` resolves it. Never write a raw path in copy.
- A code that isn't in the registry yet is a not-wired-up action, not a 404.
- **State screens are not routes.** `*-EMPTY`, `*-PENDING`, `MATCH-EXPIRED`,
  `SWIPE-*` are what a page shows when its data is in that state; the page's
  store derives the state from data. To review every Figma state without a
  backend, the store's dummy data can be swapped with a dev-only
  `?preview=<CODE>` param (ignored in production builds).

## 3. Product rules are code, not copy

The `Behavior` lines repeat on every screen because they are invariants:

- **The match deadline is server-owned.** A match carries `expiresAt` (ISO).
  The client never computes it as "matched at + 48h" and never extends it. All
  countdown maths goes through `src/lib/matchClock.js` and is rendered by the
  `useCountdown(expiresAt)` hook — `48:00:00` for the big timer, `01h 24m
  left` for the inline line, from the same function.
- **A match's status is derived, never stored twice:** `new` / `active` /
  `expiring` / `date-agreed` / `expired`, from `expiresAt`, the expiring
  threshold (one constant) and the date's acceptance. Status badges, tabs and
  copy all read that one derivation.
- **Both members must accept the date before expiry.** Sending an invite does
  not stop the clock — no UI may imply it does.
- **Compatibility ≠ Trust.** Compatibility (`92%`) describes shared signals;
  Trust Score (`4.9`) describes reliability. Separate fields, separate
  components, separate labels — never one "score".
- **Phone numbers stay private.** No profile, chat or match view renders one.
- **Safety is always reachable.** Every view of another person's profile keeps
  its "Report profile" action, as the design draws it.

## 4. Data lives in `src/data`, never in components

- Every literal — copy, labels, list items, image paths, chip lists, profile
  facts — lives in `src/data/<domain>/<name>.data.js`.
- Components import **nothing** from `src/data` directly. They read it through a
  store (rule 5).
- Tailwind class strings that vary per instance may live in data files as
  **complete literal strings**. Never build a class by concatenation — Tailwind
  cannot see `w-[${x}px]` and will not emit it.
- Copy with values in it ("You and {name} have 48 hours to agree on a date.")
  is a template filled by the store with `src/lib/fillTemplate.js`.

## 5. State lives in `src/store` (Zustand), never in components

- One store per domain: `src/store/<domain>/use<Name>Store.js` —
  `useDiscoveryStore`, `useMatchesStore`, `useProfileStore`, `useChatStore`…
- The store owns the dummy data, the state, every update action, and every
  derived operation (match status, deck order, validation, reset, submit).
- Components **only** call hooks: `const x = useSomeStore((s) => s.x)`.
  No `useState` for domain state, no hardcoded data, no business logic in UI.
- Select atomically (`(s) => s.deck[0]`), never a freshly-built object — that
  re-renders on every store change.
- `useState` is allowed only for state that is genuinely local and visual
  (a drag offset mid-swipe, a password reveal toggle).
- **View state belongs in the URL** (rule 19). The store still owns the logic:
  it derives the view from the params and its actions write them.
- Module-level Zustand stores are shared by every request on the server, so
  request-specific state is never written into them during SSR.

## 6. Validation lives in `src/schemas` (Zod)

- `src/schemas/<domain>/<name>.schema.js` exports the schema and its helpers.
  Nothing else defines validation rules.
- A screen's `Data / validation` line is copied into its schema (min age ≤ max
  age, required selects…). Field values are kept on error, errors show inline,
  and a submit in flight disables the button — as every notes frame says.
- Stores consume schemas. Components never call a schema directly.

## 7. Components, down to the atom

**There is no `components/ui` catch-all.** Every component lives in a folder
named for what it *is*.

| Folder                      | Holds                                                         |
| --------------------------- | ------------------------------------------------------------- |
| `components/atoms/`         | Button, Chip, StatusBadge, Checkbox, AppImage, AppIcon, UserAvatar, Spinner, TextLink, CountBadge |
| `components/forms/`         | FieldShell, InputField, SelectField, StoreField, StoreSelect, CheckboxField, FormRow, FormActions |
| `components/overlays/`      | Modal (the 520px dialog), SidePanel, Popover wrappers         |
| `components/actions/`       | ScreenActions (a screen's row of pill buttons), BackLink      |
| `components/cards/`         | SurfaceCard, CardHeading, FactItem / FactGrid (caption over label), FactRow (label left, value right — Where / When / Compatibility), InlineFeedback, StatusSummary, MemberRow |
| `components/status/`        | StatusScreen — the one template behind every `*-EMPTY`, `*-PENDING`, `MATCH-NEW`, `MATCH-EXPIRED` screen; StatusArtwork (icon, timer, avatar) |
| `components/discovery/`     | SwipeDeck, DiscoveryCard, DecisionControls, PreferencesCard, ActiveMatchesCard, ProfileOverviewCard, BeforeYouConnectCard |
| `components/profile/`       | ProfileView (full profile), PhotoGallery, InterestList, ProfileFacts |
| `components/matches/`       | MatchCard, MatchGrid, MatchCountdown, CompatibilityBreakdown, DateSummary |
| `components/charts/`        | CompatibilityBar (a labelled meter row)                       |
| `components/tabs/`          | StatusTabs (the matches status navigation)                    |
| `components/chat/`          | Conversation list, thread, bubbles, composer — when built     |
| `components/nav/`           | WebHeader (logo, Discover / Matches / Chats / Stories, bell, avatar menu), NavLink, AccountMenu |
| `components/notifications/` | The bell's popover and its rows                               |
| `components/layout/`        | PortalShell, Workspace (primary + FlowContext aside), DiscoveryWorkspace (three columns) |
| `components/motion/`        | Reveal and other shared transitions                           |
| `components/decor/`         | Purely decorative, `aria-hidden` pieces                       |
| `components/brand/`         | Logo and brand marks                                          |
| `components/providers/`     | Client providers mounted at the root — ToasterProvider, UrlRouterBridge |
| `components/shadcn/`        | shadcn primitives. Edit only to fix a defect or bind it to our tokens, and say why in a comment |

- Add a folder when a new concern appears (`venues/`, `stories/`, `admin/`)
  rather than widening an existing one. A folder past a handful of files
  splits by feature.
- Shared hooks live in `src/hooks/` (`useCountdown`, `useUrlParams`,
  `useSwipe`, `useRetainedValue`…); non-React services in `src/lib/`.
- `src/app/<route>/_components/` only for a composition genuinely single-use
  on that route. If a second route needs it, it moves out.
- A helper component defined inside another file is a bug. One component, one
  file, with named props.

## 8. `cn()` for every conditional or merged class

- Always `import { cn } from "@/lib/cn"` (`clsx` + `tailwind-merge`). Never
  template literals, `.join(" ")` or string concatenation for classes.
- tailwind-merge only knows Tailwind's own names, so every custom scale is
  registered with it: the type scale in `src/lib/typography.js`, radii in
  `src/lib/radii.js`, control heights in `src/lib/controls.js`. **Add a class to
  a scale in `globals.css` → add its name to that file**, or overrides silently
  fail.

## 9. Buttons

All button behaviour lives in `src/components/atoms/Button.jsx`. Never style a
raw `<button>` at a call site.

- The design's actions are **pills** (fully rounded). Variants follow it:
  `primary` (rose fill, white label — Like, Show matches), `outline` (white
  with rose rule and rose label — Pass, Reset filters, Report profile),
  `soft` (rose-light fill), `ghost`, `link`, `danger`. Add a variant when Figma
  draws a new look; never restyle at a call site.
- Sizes come from the control-height tokens (rule 12), never a raw height.
- `isDisabled` disables and dims; `isLoading` disables and shows a spinner.
- `notFunctional` — for UI with no backend yet. `onClick` still runs, the
  native submit is blocked, and a toast says the feature isn't wired up.
  `notFunctionalProps(content)` in `src/lib/notFunctional.js` builds the props.
- A button that goes somewhere renders a real link (`href` from `hrefFor`).
- Every state change is a smooth transition; pressing scales it down slightly.

## 10. Layouts absorb what repeats

Shared chrome goes in a segment's `layout.js`, never copy-pasted into pages.

- Route groups: `(auth)` for sign-in / onboarding, `(portal)` for the signed-in
  user web portal, `(admin)` later. `(portal)/layout.js` renders `PortalShell`:
  the 88px `WebHeader` and the canvas below it.
- The header's nav items, the active-item rule and the avatar menu are data
  (`src/data/nav/web-header.data.js`). A section stays active on its inner
  pages (`/matches/goldenhour` lights Matches).
- The design has two page compositions; both are layout components, not
  per-page markup:
  - **`Workspace`** — a 904px primary card and the 352px "Flow context" aside,
    24px apart (FILTERS, MATCH-*, COMPAT and every state screen). The aside's
    content is data per screen.
  - **`DiscoveryWorkspace`** — three columns, 240 / 448 / 544px with 24px gaps
    (DISCOVER and SWIPE-*).
  Both sit in the 1280px content column with 80px side gutters at 1440. The
  numbers are tokens / constants in `src/lib/layout.js`, never repeated.
- A page renders only what is unique to it. A heading the design draws inside
  the workspace (title + body) is `PageHeading`, fed by data.

## 11. Every state screen is `StatusScreen`

The design draws many screens with one skeleton: back link, title, body, a
status block, a row of pill actions, the Flow context aside. They are one
component driven by data, never one file each.

- `status/StatusScreen` takes a screen's content (`src/data/status/
  <CODE>.data.js` or one file keyed by code) and renders: `BackLink`,
  `PageHeading`, then either `StatusSummary` (icon left, title + text —
  `DISCOVER-EMPTY`, `MATCHES-EMPTY`, `COMPAT-PENDING`, `FILTERS-EMPTY`) or
  `StatusArtwork` (centred icon, big timer, avatar — `MATCH-NEW`,
  `MATCH-EXPIRED`), then `ScreenActions`.
- A screen whose only difference is copy and actions is a data entry. If a new
  state needs a component change, the component wasn't reusable enough — fix it.

## 12. Design tokens mirror Figma variables

Colours, type, spacing, radii and control heights come from
`src/app/globals.css`, which mirrors `01 / Design System`. Pull them with
`get_variable_defs` before adding any. Never hardcode a hex, a font size or a
radius in a component.

Known variables (verify against the Design System page; extend from it):

| Figma variable                     | Value                          | Token / class        |
| ---------------------------------- | ------------------------------ | -------------------- |
| `--48date-rose` / primary-500      | `#E11D48`                      | `primary`            |
| `--48date-roseLight`               | `#FFF1F4`                      | `primary-soft`       |
| `text/strong-950`                  | `#171717`                      | `text-strong`        |
| `text/sub-600`                     | `#5C5C5C`                      | `text-sub`           |
| `stroke/soft-200`                  | `#EBEBEB`                      | `stroke-soft`        |
| `bg/white-0`                       | `#FFFFFF`                      | `surface`            |
| `radius-16`                        | 16px                           | `rounded-16` (cards) |
| `spacing-8/16/24/32`               | 8 / 16 / 24 / 32               | Tailwind spacing     |

Type is **Manrope** (via `next/font`), one class per Figma text style:

| Figma style                          | Size / line / weight | Class           |
| ------------------------------------ | -------------------- | --------------- |
| `48Date / Web workspace / Title`     | 28 / 38 / 600        | `text-title`    |
| `48Date / Web workspace / Section`   | 20 / 28 / 600        | `text-section`  |
| `48Date / Web workspace / Body`      | 16 / 24 / 400        | `text-body`     |
| `Text md/Bold`                       | 16 / 24 / 700        | `text-body-bold`|
| `48Date / Web workspace / Label`     | 14 / 22 / 600        | `text-label`    |
| `48Date / Web workspace / Caption`   | 12 / 18 / 500        | `text-caption`  |

- A new Figma style → a new class in `globals.css` and its name in
  `src/lib/typography.js` (rule 8). Never approximate with the nearest one.
- Light theme only until the Design System page defines another mode. Even so,
  components read tokens only, so a theme is a token block — never a `dark:`
  colour class.

## 13. Control heights

| `size` | Height | Used for                                                      |
| ------ | ------ | ------------------------------------------------------------- |
| `lg`   | 56px   | Pill actions and form inputs/selects (`h-control`)            |
| `md`   | 44px   | Back navigation, status tabs (`h-control-md`)                 |
| `sm`   | 34px   | Chips — Verified, 92% compatibility, interests (`h-chip`)     |

Controls take a `size` prop mapped in `src/lib/controls.js`. Never give a
control its own `h-*` or vertical padding for height. Check each new screen's
real heights against these and add a size only when Figma draws one.

## 14. Images

- **Never use `<img>`.** Always `next/image`, via `atoms/AppImage`, with
  explicit dimensions or `fill` + `sizes`.
- Profile photos (the discovery card, the profile hero, the gallery, match
  cards) are `object-cover` inside a fixed-ratio frame from the design, so a
  photo of any shape never shifts the layout.
- Dummy photos live once in `public/people/<handle>/` — one file per photo,
  every view points at the same file. Compare bytes before adding an asset;
  shared icons live in `public/icons/shared/`.

## 15. Icons are Hugeicons, described in data

The design's icons are Hugeicons (`Hugeicons / favourite`, `arrow-left-02`,
`clock-01`, `search-01`). Use `@hugeicons/react` with
`@hugeicons/core-free-icons`.

- A data file describes an icon as `{ hugeicon: "FavouriteIcon", size }` or,
  for brand artwork exported from Figma, `{ src, width, height }`.
  `atoms/AppIcon` renders either; components never branch on it.
- When an icon isn't in the free set or the export is broken, use the closest
  glyph and say so in a comment beside the data entry. An icon redrawn by eye
  from a screenshot says `redrawn from the screenshot; not an exact export`.

## 16. Optional chaining is mandatory

Use `?.` and `??` on anything that could be absent — array items, props,
nested config, callback props (`onClick?.(event)`), parse results, an empty
deck, a match with no date yet. No bare `a.b.c` where `a` or `b` is not proven.

## 17. The swipe deck

- `discovery/SwipeDeck` reads the deck from `useDiscoveryStore`; Pass, Like and
  Super Like are store actions (`pass(id)`, `like(id)`, `superLike(id)`) shared
  by the buttons, the drag and the keyboard — one code path.
- Dragging the left / right half of the photo (the design's two drag zones)
  is `hooks/useSwipe` (pointer events, a threshold constant, spring back under
  it). Arrow keys mirror it. The drag offset is the one allowed `useState`.
- `SWIPE-PASS`, `SWIPE-LIKE`, `SWIPE-SUPER` are feedback states of the deck,
  then `DISCOVER-NEXT` shows the next card. An empty deck is `DISCOVER-EMPTY`.
  A like that matches leads to `MATCH-NEW`.
- Under `prefers-reduced-motion` a decision swaps the card without the fling.

## 18. Reveal motion: every component reveals itself, parents set the order

A page never wraps its content in one big `Reveal`; things arriving one after
another reads as premium.

- Every card, panel and list row's root is `<Reveal as="…" delay={revealDelay}>`
  and takes a `revealDelay` prop (seconds, default `0`). Layout wrappers
  (columns, grids) are plain `div`s.
- Parents hand out delays only through `src/lib/motion.js`:
  `revealDelayAt(start, index)` for siblings, `nestedRevealDelayAt(parentDelay,
  index)` for a card's own rows. Never a hand-written delay at a call site.
- The page sets the sequence in reading order, from the data's lengths: in
  DISCOVER the preferences column, then the deck, then the overview cards.
- Timing (`REVEAL_STEP`, `REVEAL_NESTED_OFFSET`, `REVEAL_DURATION`,
  `REVEAL_EASE`) lives in `src/lib/motion.js`. `Reveal` drops movement under
  `prefers-reduced-motion`. A reveal never flashes a scrollbar.

## 19. View state lives in the URL, through one service

Anything a link, a refresh or Back should keep — the matches status tab, an
open modal, a chat's open conversation, a search — is a **search param**, read
and written through one service. Never `useState`, never a store field, never
hand-rolled `URLSearchParams` / `history.pushState` in a feature.

| Piece  | Where                          | Does                                                |
| ------ | ------------------------------ | --------------------------------------------------- |
| Schema | `src/schemas/<domain>/<page>-params.schema.js` | Zod, every field `.catch()`es its default so a bad link falls back |
| Parse  | `src/lib/url/searchParams.js`  | `parseSearchParams(schema, source)` — server or client |
| Write  | `src/lib/url/urlState.js`      | `writeUrlParams(patch, { history, shallow })` from store actions |
| Read   | `src/hooks/useUrlParams.js`    | Typed params, memoised on the query string           |

- Values are ids or enum slugs, never labels; defaults are dropped, so the
  resting state is a bare path. `history: "replace"` by default.
- A page whose client components read the URL renders per request
  (`await connection()` or reading `searchParams`) — never a prerendered
  default view that flashes.
- **No silent default selection.** Nothing shows as open unless the URL names
  it (a conversation, a match's detail).
- **Discovery preferences are not view state** — they are the user's saved
  settings (FILTERS "You can always change these later"), so they live in
  `useDiscoveryStore` (later the API), not the URL.

## 20. A record with its own page is its own route

A profile (`DISCOVER-PROFILE`), a match, a conversation is a route:
`/discover/[handle]`, `/matches/[matchId]`, `/chats/[conversationId]`.
`page.js` is a server component: read the id from `await params`, look it up
through the store's `…ById` reader, `notFound()` for an unknown id, and name the
record in `generateMetadata`. Lists link to it with real `<a>`s.

## 21. Modals and panels

- The design's dialogs are 520px centred modals — `overlays/Modal` (shadcn
  `dialog`), never a side drawer. Check whether a Figma dialog is centred or
  edge-aligned before choosing; a right-edge drawer is `overlays/SidePanel`
  (shadcn `sheet`).
- Which modal is open lives in the URL (`?modal=<id>`), read through the
  feature's store; keep the closing content with `useRetainedValue` so it
  doesn't blank mid-animation.
- One scrim for every overlay (`SCRIM_CLASSES` in `src/lib/overlay.js`); motion
  uses the project curve and the exit is quicker than the entrance.

## 22. Forms: one frame, one store factory, one schema

- Every field sits in `forms/FieldShell` (label above, control, error/helper
  line). Inputs and selects both render through it, so they share label style
  (`text-label`), the 56px box and error treatment.
- A form's state is a `createFormStore` store over its Zod schema; submit,
  reset and cancel are store actions. Bind fields with `StoreField` /
  `StoreSelect` from a data config; side-by-side pairs (Minimum / Maximum age)
  are `FormRow` from a data `layout`.
- A date or time is a real `type="date"` / `type="time"` control, never free
  text with a date-shaped placeholder.
- With no backend, a valid submit shows the not-wired-up toast; it never
  pretends the action happened.

## 23. shadcn is primitives, not a second design system

- Primitives land in `components/shadcn/` as `.jsx`. `globals.css` maps
  shadcn's semantic names onto our tokens.
- `npx shadcn@latest add` output is not trusted: check its diff for wrong `cn`
  imports, demo files, `dark:` classes and lint failures, and clean up.
- Overlays animate through `tw-animate-css`, which the installer does not add —
  `@import "tw-animate-css"` in `globals.css`, or every overlay pops in.
- Wrap each primitive once in a project component that owns the look, and use
  the wrapper everywhere — never a raw primitive at a call site.

| Need            | shadcn     | Project wrapper          |
| --------------- | ---------- | ------------------------ |
| Dialog          | `dialog`   | `overlays/Modal`         |
| Drawer          | `sheet`    | `overlays/SidePanel`     |
| Select          | `select`   | `forms/SelectField`      |
| Checkbox        | `checkbox` | `atoms/Checkbox`         |
| Avatar          | `avatar`   | `atoms/UserAvatar`       |
| Tabs            | `tabs`     | `tabs/StatusTabs`        |
| Popover / menu  | `popover` / `dropdown-menu` | `notifications/…`, `nav/AccountMenu` |

## 24. Avatars are `UserAvatar`

Every person picture is `atoms/UserAvatar`. With no `src` it shows initials
derived from the name — data never stores initials. Sizes come from its `size`
prop (48px member row, 96px match artwork…), never a call-site class.

## 25. Toasts

`goey-toast`. `<GooeyToaster />` is mounted once in the root layout via
`ToasterProvider`, its stylesheet imported once at the root. Call
`gooeyToast.*` from stores or handlers only.

## 26. Responsive: desktop is the spec, phones follow `02 / User Final Design`

The web frames are 1440px. Below that:

- `DiscoveryWorkspace` and `Workspace` stack to one column under `lg`, primary
  content first; the Flow context aside moves below it. The header's nav
  collapses per the phone designs on `02 / User Final Design` — check them
  before inventing a pattern.
- Fact grids drop from three / two columns to one; `ScreenActions` stack full
  width on a phone.
- Nothing scrolls sideways. A breakpoint decision that isn't in the design is
  said out loud in the change, not hidden.

## 27. Pixel fidelity is mandatory, not "close enough"

"Use the project's components" is about implementation, never licence to
approximate spacing, type, weight or colour.

- Call `get_design_context` on the specific node and match size, weight,
  line-height, colour and padding. A component default is a starting point —
  check it against the node.
- Read every text's colour: captions are `text-sub`, labels `text-strong`,
  links and chips rose.
- Codegen can resolve an instance to its master default. When instances look
  suspiciously identical, pull `get_screenshot` and check the pixels.
- Before calling a screen done, screenshot the running page at 1440 and compare
  it with the Figma screenshot side by side.

## 28. Accessibility is part of the design

- Every icon-only control has an `aria-label`; decorative icons are
  `aria-hidden`.
- The countdown exposes a readable label ("1 hour 24 minutes left") and does
  not announce every tick.
- The swipe deck is fully usable by keyboard and buttons; focus is visible on
  every control in the rose ring the design system defines.

## 29. Never commit or push unless asked

**Never commit and never push unless the user says so, in that message.** No
exceptions — not after finishing a task, not to "save progress", not because an
earlier message allowed it. Leave the work in the tree and say what changed.

When told to commit: commit on the working branch (`roy` unless told
otherwise), never on `main`; split into one commit per concern, each one a
state that builds. "Commit" never implies push.

## 30. Capture what each request teaches

Whenever a request carries a lasting preference or decision — a design
language, a component pattern, a workflow habit — write it into this file in
the same change, and add a one-line pointer in `CLAUDE.md`. When a build adds a
genuinely new reusable piece (a variant, a cell, a hook), list it under
**Pieces registry** below so the next build reaches for it first.

## 31. Reuse before you build

Before writing any component, search the project for one that already does the
job — the folders in rule 7, the stores, `src/lib`, and the Pieces registry.
Extend with a prop or variant before creating a new one; a near-duplicate is a
rule 0 defect. When nothing fits, start from a shadcn primitive (rule 23).

## Pieces registry

Append one line per new reusable piece: name, what it's for, where it was first
needed (screen code). Keep it short; the folder table above is the map, this is
the index.

<!-- e.g.
- `cards/FactRow` — label left, value right (Where / When / Compatibility). MATCH-EXPIRING, DISCOVER-PROFILE.
-->