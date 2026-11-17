# Pixel theme verification — 2026-11-17

Reference: user-supplied green tea-journal panel screenshot.

- Typography: Galmuri11 body/navigation; DungGeunMo headings and explicitly marked title/emphasis roles. Bold weight alone no longer changes font family.
- Shared palette: olive panels/background, cream text, muted green borders, distinct semantic action/error colors.
- Local Galmuri11 regular/bold match deep-colony. Pixel cup mark and square rating meters retained.
- Safari native browser: actual home, closed/open FAB, 390px app iframe and corrected Korean title wrapping inspected. Dark shared-component preview and Radix portal dialog/input inspected.
- Reduced-motion visibility, long note/photo styling and rating mapping have regression coverage; authenticated live note/photo flows were not browser-verified because the local API is unavailable.
- `bash scripts/full-release.sh --check-only` passed: TypeScript, ESLint, frontend 57 suites / 414 tests, Vite build, backend 17 suites / 212 tests, Nest build and offline health/process/artifact failure matrices.
- Final frontend rerun after the NoteCard nesting repair: 57 suites / 414 tests passed, zero skips. Independent final review ran 35 focused tests successfully. Full offline deployment-check fixtures also passed required-gate failure propagation.
- Independent review: no remaining blocking findings.
- No remote deployment performed. Local API remains unavailable; authenticated end-to-end persistence is not verified.

## Workspace recovery

Six missing source files were restored byte-for-byte from upstream tree
8872ff81cb0f3bb64846a144190c67acee791ceb (FLYLIKEB/chamung):
UserRecap.tsx, flavorTags.ts, FlavorWheel.tsx, flavorWheelConfig.ts,
useUserRecapData.ts, utils/recap.ts. No existing source files were replaced in recovery.
The installed date-fns 3.6.0 package was repaired from its exact npm tarball;
No dependency versions were changed. Later missing cheerio 1.2.0 and @nestjs/event-emitter 3.0.1 package files were likewise repaired from exact npm tarballs. Node engine metadata was aligned to version 22.
Git HEAD already references an unavailable object; Git history was not modified.

## Local review

Run `npm run dev -- --port 5187 --host 127.0.0.1`.
The app is at `/`; `/design-preview.html` renders the actual shared components with
explicit sample data and performs no API writes. It is not a production route.
