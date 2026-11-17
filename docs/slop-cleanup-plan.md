# ChaLog cleanup plan — 2026-11-17

Scope: all 18 audit findings plus inaccurate release/runtime documentation. Preserve the green pixel design, DungGeunMo headings, Galmuri11 body, routes, user data, authentication and API compatibility. No deployment or Git history repair.

## Behavior lock and order

1. Add regression checks before edits for reduced-motion visibility, rating pointer mapping, closed-menu keyboard access, explicit loading/error states, and health failure detection.
2. Fix masking fallbacks: loading/API failure must not become empty data; unhealthy service must fail validation; required checks cannot silently skip.
3. Remove verified unused duplicate source files and unreachable guest UI; consolidate saved-list data/render paths without removing entry routes.
4. Consolidate CSS rather than adding override layers. Preserve useful layout and states; explicit typography roles; distinct action variants; simplify decorative header behavior.
5. Shorten repeated hero copy, remove permanent NEW badges, use truthful feed/action labels. Remove unavailable legal links instead of inventing legal policy text.
6. Repair TypeScript alias/types and real lint rules. Run focused regressions then full frontend tests/typecheck/lint/build, backend health tests/build and offline shell checks.
7. Independent review of changed behavior and artifacts; inspect actual local UI where tooling permits.

## Fallback classification

- API catch -> [] and missing loading flags: masking; replace with explicit error/retry and loading states.
- Health body/HTTP mismatch and unconditional green summaries: masking; require HTTP and JSON health contract, propagate nonzero exit status.
- Optional lint/typecheck in release: masking; make checks mandatory.
- Auth token refresh/network retries: grounded compatibility behavior; preserve, outside cleanup scope.
- Missing-image placeholder and unauthenticated UI: grounded fail-safe; preserve and test relevant paths.

## Acceptance checklist

- [x] 1 reduced motion visibility; 2 errors vs empty; 3 latest feed label
- [x] 4 hidden menu focus; 5 pointer score mapping; 6 action labels/navigation
- [x] 7 no fake legal buttons; 8 real lint/typecheck/build gates; 9 unhealthy fails
- [x] 10 consolidated styles; 11 valid color tokens; 12 semantic button/color states
- [x] 13 explicit font roles; 14 concise hero; 15 no permanent NEW
- [x] 16 remove obsolete glass/decorative header behavior
- [x] 17 no verified source copies/unreachable UI; 18 one saved-list implementation
- [x] release scripts and Node/platform/docs truthful
- [x] independent review and final evidence

Writer: root. Reviewer: separate code-reviewer lane. Source backup: /tmp/chalog-pre-cleanup/source.tgz.

## Completion evidence

- Required local check-only pipeline exited 0: frontend 414 tests, backend 212 tests, TypeScript, ESLint, both builds and health/process/artifact fixtures.
- Final frontend rerun after all source edits: 57 suites, 414 tests, no skips. Full shell fixture suite verifies required-check failure propagation.
- Independent reviewer approved after fixes; actual Safari desktop/mobile/error/menu/dark-dialog rendering checked.
- Scope limits: no deployment; local API unavailable, so real authenticated persistence and loaded note-photo flows were not browser verified. Existing broken Git HEAD was not changed.
- Logs: `/tmp/chalog-final-gates.log`, `/tmp/chalog-final-frontend-tests.log`, `/tmp/chalog-final-shell-checks.log`.
