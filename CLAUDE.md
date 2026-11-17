@AGENTS.md

**Never commit or push unless the user says so in that message** — see rule 29
in AGENTS.md. Permission covers that one request only.

Also binding, in full in AGENTS.md:

- **Rule 0** — never write the same code twice; never re-pass classes a
  component already applies.
- **Rule 1** — before building a screen, read its `D / web / <CODE>` notes
  frame (Entry, Actions → targets, Data / validation, Behavior) and call
  `get_design_context` on the `W / <CODE>` node itself.
- **Rule 2** — screen codes are the navigation map: one registry
  (`src/data/screens/screens.data.js`), actions name a code, `hrefFor` resolves
  it. `*-EMPTY` / `*-PENDING` / `SWIPE-*` / `MATCH-EXPIRED` are states of a
  page derived from data, reviewable with dev-only `?preview=<CODE>`.
- **Rule 3** — product rules are code: the match deadline is server-owned
  (`expiresAt`, `lib/matchClock.js`, `useCountdown`); match status is derived
  once; an invite doesn't stop the clock; Compatibility ≠ Trust; phone numbers
  stay private; "Report profile" stays on every profile view.
- **Rules 4–6** — literals in `src/data`, state in Zustand stores in
  `src/store`, validation in Zod schemas in `src/schemas`. Components only
  call store hooks, selected atomically.
- **Rule 7** — no `components/ui`; folders by what a component is
  (`atoms`, `forms`, `cards`, `status`, `discovery`, `matches`, `profile`,
  `nav`, `layout`…). One component per file.
- **Rule 8** — `cn()` for every class merge; custom scales registered in
  `lib/typography.js`, `lib/radii.js`, `lib/controls.js`.
- **Rule 9** — every button is `atoms/Button` (pill variants `primary`,
  `outline`, `soft`…), `notFunctional` for actions without a backend, a real
  link when it goes somewhere.
- **Rule 10** — `(portal)/layout.js` renders `PortalShell` (88px `WebHeader`);
  pages use `Workspace` (904 + 352 Flow context aside) or `DiscoveryWorkspace`
  (240 / 448 / 544). Nav is data.
- **Rule 11** — every state screen is `status/StatusScreen` driven by data
  (`StatusSummary` or `StatusArtwork`, then `ScreenActions`).
- **Rule 12** — tokens mirror Figma variables in `globals.css`: rose
  `#E11D48`, Manrope type classes `text-title` / `section` / `body` / `label` /
  `caption`. Never a hex or raw size in a component; no `dark:` colour classes.
- **Rule 13** — control heights by `size`: 56px actions and inputs, 44px back
  and tabs, 34px chips.
- **Rule 14** — `next/image` via `AppImage`, never `<img>`; photos
  `object-cover` in fixed frames; assets stored once.
- **Rule 15** — icons are Hugeicons (`@hugeicons/react`) described in data,
  rendered by `AppIcon`.
- **Rule 16** — optional chaining on anything that could be absent.
- **Rule 17** — the swipe deck: one store action per decision shared by
  buttons, drag (`useSwipe`) and keyboard; reduced motion swaps without the fling.
- **Rule 18** — every card and row reveals itself; parents hand out delays via
  `lib/motion.js` helpers only.
- **Rule 19** — view state (tab, open modal, open conversation, search) lives
  in the URL through `src/lib/url/` and `useUrlParams`; no default selection.
  Discovery preferences are saved settings, not URL state.
- **Rule 20** — a profile, match or conversation is its own route that 404s
  unknown ids.
- **Rule 21** — dialogs are the 520px `overlays/Modal`, open state `?modal=`;
  one scrim for all overlays.
- **Rule 22** — forms: `FieldShell` + `StoreField` / `StoreSelect` over
  `createFormStore` + a Zod schema; dates and times are real date/time inputs.
- **Rule 23** — shadcn primitives in `components/shadcn/`, cleaned up after
  `add`, `tw-animate-css` imported, each wrapped once.
- **Rule 24** — every person picture is `atoms/UserAvatar`, initials derived.
- **Rule 25** — toasts are `goey-toast`, called from stores or handlers.
- **Rule 26** — desktop (1440) is the spec; phones follow
  `02 / User Final Design`; nothing scrolls sideways.
- **Rule 27** — pixel fidelity: match the node's size / weight / colour
  exactly and compare a real screenshot with Figma before calling it done.
- **Rule 28** — accessibility: labels on icon controls, a readable countdown,
  a keyboard-usable deck.
- **Rule 30** — when a request carries a lasting preference, add it to
  AGENTS.md as a rule (plus a pointer here) and log new pieces in the
  Pieces registry, in the same change.
- **Rule 31** — search for an existing component before building one.
- **Rule 60** — first look fits the screen: at 100 % (1440×900 and the other
  common desktop windows) every page shows its whole primary composition without
  scrolling (Discover: photo, name and the decision buttons together), with the
  Figma type sizes, and looks polished at first sight.

<!--
  The project rules live in AGENTS.md and are imported above, so there is exactly
  one copy of them — duplicating the list here would break the project's own
  "never write the same thing twice" rule and let the two files drift apart.
  The commit rule is restated above on purpose, as a pointer: it is the one rule
  that cannot be undone once broken. Edit the rules themselves in AGENTS.md.
-->