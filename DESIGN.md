# Design

## Source of truth
Active · 2026-11-17. Scope: shared navigation. Evidence: Header.tsx, BottomNav.tsx, globals.css, existing navigation tests and user screenshots.

## Brand
A quiet Korean tea journal. Preserve green surfaces, ivory lettering and existing pixel typography. Avoid decorative panels, glass effects and oversized selected tiles.

## Product goals
Make navigation unobtrusive and legible while keeping all existing destinations available. This change does not redesign content cards or primary action buttons.

## Personas and jobs
Tea drinkers recording notes and browsing community posts, on phones and desktop.

## Information architecture
Header: home/back/title, search, notifications, settings/login. Navigation: home, community, cellar, personal notes. Preserve routes and authentication behavior.

## Design principles
Content takes priority. Navigation meets screen edges; open spacing establishes boundaries. Selection uses foreground contrast and a short label underline.

## Visual language
Reuse existing green background, ivory foreground, muted text and border tokens. No borders, separator lines, shadows, blur, gradients or enclosing navigation boxes. Keep existing fonts and icons.

## Components
Header, mobile BottomNav and desktop sidebar have no borders, separators or shadows. PersonalizedHero and its write action have transparent backgrounds and no borders. Shared buttons and other pixel surfaces remain independent.

## Accessibility
Preserve accessible names, keyboard focus and aria-current. Navigation touch targets are at least 44px high. Active labels have an underline as well as color contrast. Retain readable labels beside or below icons.

## Responsive behavior
Below md: full-width top and bottom bars with safe-area padding. At md and above: retain left navigation, 160px wide, with header starting to its right. Preserve content spacer tokens.

## Interaction states
Existing notification counts, signed-out login routes and active destination handling remain. Opaque bars prevent scrolling content from showing through.

## Content voice
Keep familiar concise Korean menu labels. Add no promotional or decorative copy.

## Implementation constraints
React and Tailwind with globals.css tokens. No new dependencies or assets. Validate navigation tests, lint, typecheck, build and production assets. Browser inspection depends on availability of a controllable browser surface.

## Open questions
None blocking this scoped navigation change.
