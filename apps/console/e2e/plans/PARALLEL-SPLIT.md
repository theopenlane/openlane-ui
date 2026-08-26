# Parallel authoring split — Claude ⇄ Codex

Two agents author Playwright specs in this repo **at the same time, in the same
working tree**. Isolation is by file ownership, not by branch. Respect it exactly.

## Ownership

| Path                                             | Owner  |
| ------------------------------------------------ | ------ |
| `e2e/tests/automation-*.spec.ts`, `developers-*.spec.ts` | Codex  |
| `e2e/tests/platforms-*.spec.ts`, `trust-center-documents-*.spec.ts` | Codex (from round 3) |
| `src/components/pages/protected/platforms/**`, `.../trust-center/documents/**` | Codex (from round 3) |
| `e2e/utils/api-automation.ts`                    | Codex  |
| `src/components/pages/protected/automation/**`   | Codex  |
| `src/components/pages/protected/developers/**`   | Codex  |
| every other `e2e/tests/*.spec.ts`                | Claude |
| `e2e/utils/api.ts`, `e2e/plan.md`, `e2e/COVERAGE.md` | Claude |
| all other `src/**`, `packages/**`                | Claude |

Never edit a file owned by the other agent — not even to fix a lint nit.
`e2e/utils/api.ts` is read-only for Codex: it exports `gql`, `seedEntity`,
`getOwnerApi` and `ApiSession`; build new seeders on top of them in
`e2e/utils/api-automation.ts`.

## Area assignment

- **Codex:** `automation` (campaigns, communications, questionnaires + templates
  + editors, tasks, workflows list/editor/wizard/inbox/instances) and
  `developers` (api-tokens, personal-access-tokens). 64 open high-priority items,
  listed in `plan.md` under 🔴 → `### automation` / `### developers`.
- **Codex (added round 3):** `registry/platforms` and `trust-center/documents`,
  handed over because Codex's own areas are down to backend-blocked lines only.
- **Claude:** controls, the rest of registry, exposure, programs,
  organization-settings, the rest of trust-center, user-settings, evidence,
  policies, procedures, standards, user-management, cross-cutting.

Claude folds Codex's completed items into `plan.md` at the end of each round;
Codex reports what it covered instead of editing `plan.md`.
