# Design

## Source of truth
Active · 2026-11-18. Scope: shared navigation, note detail and teaware. Evidence: Header.tsx, BottomNav.tsx, globals.css, existing navigation tests and user screenshots.

## Brand
A quiet Korean tea journal. Preserve green surfaces, ivory lettering and existing pixel typography. Avoid decorative panels, glass effects and oversized selected tiles.

## Product goals
Make navigation unobtrusive and legible while keeping all existing destinations available. Note detail combines tea information, full memo, session records, teaware, photos and sensory profile in one card. Primary action buttons retain their existing style.

## Personas and jobs
Tea drinkers recording notes and browsing community posts, on phones and desktop.

## Information architecture
Header: home/back/title, search, notifications, settings/login. Navigation: home, community, cellar, personal notes. Preserve routes and authentication behavior.

## Design principles
Content takes priority. Navigation floats with space around its edges; background color establishes boundaries. Selection uses foreground contrast and a short label underline.

## Visual language
Reuse existing green card backgrounds, ivory foreground and muted text tokens. Floating controls use a solid 4px #293619 outer outline; avoid bright borders, separator lines, blurred shadows, blur and gradients. Keep existing fonts and icons.

## Components
TeawareSelector offers 264 pixel choices across nine tool categories, with category counts, search and a bounded scrolling gallery alongside the reusable personal photo collection. The 33 source designs come from Deep Colony; seven deterministic palette/pattern variations preserve each original silhouette, alpha and dark outline. Selection is optional, up to 12 tools. TeawareBoard places brewing vessels behind cups, with pitchers and kettles to the sides, on one rectangular pixel bamboo mat. Use original transparent sprites with nearest-neighbor rendering and small Korean labels; no individual decorative cards. Personal photos fit within the tool area without cutting off the object. Saved notes retain stable variant IDs and personal snapshots; legacy presets remain readable. Exported note images use the same placement and mat.

Header, mobile BottomNav and desktop sidebar use a solid 4px #293619 outer outline to separate overlapping content. PersonalizedHero and its write action have transparent backgrounds and no borders. Shared buttons and other pixel surfaces remain independent.

## Accessibility
Preserve accessible names, keyboard focus and aria-current. Navigation touch targets are at least 44px high. Active labels have an underline as well as color contrast. Retain readable labels beside or below icons.

## Responsive behavior
Below md: floating top and bottom bars with side margins and safe-area offsets. At md and above: retain a floating left navigation, 140px wide, with header starting to its right. Preserve content spacer tokens. Note detail combines tea information, full memo and sensory profile into one natural-height card, at most 48rem wide. Image sharing previews a readable PNG with all text and sensory ratings; save is always available, file sharing uses the device share sheet when supported.

## Interaction states
Existing notification counts, signed-out login routes and active destination handling remain. Opaque bars prevent scrolling content from showing through.

## Content voice
Keep familiar concise Korean menu labels. Add no promotional or decorative copy.

## Implementation constraints
React and Tailwind with globals.css tokens. No new dependencies. Original six pixel SVG teaware illustrations are authorized by the teaware feature. Validate navigation tests, lint, typecheck, build and production assets. Browser inspection depends on availability of a controllable browser surface.

## Open questions
None blocking this scoped navigation change.
