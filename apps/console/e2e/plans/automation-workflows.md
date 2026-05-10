# Automation: Workflows Plan

Routes:

- `(protected)/automation/workflows`
- `automation/workflows/wizard`
- `automation/workflows/definitions/[id]`
- `automation/workflows/editor`
- `automation/workflows/inbox`
- `automation/workflows/instances`
- `automation/workflows/templates`

Tier: **3** — large surface, low traffic. Smoke only for now.

## Per-area memory note

The `feat-workflows` branch did major cleanup recently — the wizard was decomposed and bugs fixed. Don't assume current `main` matches earlier behavior.

## List

- [x] /automation/workflows renders an h2 ("Create your first workflow" for empty orgs, "Workflows" otherwise). _(automation-other.spec.ts)_
- [ ] Table: name, trigger, actions, last run, status.
- [ ] Filter / search / sort.

## Wizard

> **Out of scope:** AI-suggestion quality. See
> [`00-priorities.md`](00-priorities.md). The wizard's AI path requires
> `GOOGLE_GENERATIVE_AI_API_KEY` and is non-deterministic.

- [ ] Open wizard.
- [ ] Stepper persists across navigation (don't reset on back).
- [ ] Manual-config path (skip the AI input) → fill trigger + conditions + actions → save.
- [ ] Save as template option.
- [ ] Activate workflow → appears in list.

## Definition page

- [ ] View trigger config.
- [ ] View conditions (if-then-else).
- [ ] View actions (notification / task / status update / email / assign).
- [ ] Schedule (for scheduled triggers).
- [ ] Test execution: dry-run → result panel.
- [ ] Activate / deactivate toggle.

## Visual editor

- [ ] Drag trigger / condition / action onto canvas.
- [ ] Wire blocks together.
- [ ] Save → reload → topology preserved.

## Templates

- [ ] List saved templates.
- [ ] Duplicate → opens editor with cloned config.

## Inbox

- [ ] Pending workflow tasks/approvals listed.
- [ ] Approve / reject from inbox.

## Instances

- [ ] List past executions (timestamp, trigger, actions taken, result).
- [ ] Click instance → detail with full step log.

## Permissions

- [ ] ReadOnly cannot create / edit / activate / approve from inbox.

## Out of scope

- Long-running executions (use seeded instances instead).
