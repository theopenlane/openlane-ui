# Automation: Campaigns & Communications Plan

Routes:

- `(protected)/automation/campaigns`
- `automation/campaigns/[id]`
- `(protected)/automation/communications`

Tier: **4** — niche; smoke only.

> **Out of scope:** real email/message delivery and delivery metrics (resend
> provider has no key in dev). See [`00-priorities.md`](00-priorities.md). We
> test that the UI saves correctly, not that messages reach inboxes.

## Campaigns — list

- [x] /automation/campaigns renders the "Campaigns" heading. _(automation-other.spec.ts)_
- [ ] Table: name, type, status, start date, recipient count.
- [ ] Filter / sort.

## Campaigns — create

- [ ] Form: name, type, recipient segment, message template, schedule.
- [ ] Preview button shows rendered message.
- [ ] Save schedules.

## Campaigns — detail

- [ ] Recipients list and status render (against seeded data).
- [ ] Edit before send (only when status = Draft / Scheduled).
- [ ] Cancel scheduled campaign.

## Communications — templates

- [x] /automation/communications renders the "Communications" heading. _(automation-other.spec.ts)_
- [ ] List templates: name, type, usage count, last sent.
- [ ] Create template: name, type, subject, body with variables.
- [ ] Edit template; variable substitution preview.
- [ ] Delete with confirmation.

## Communications — send

- [ ] Pick template → choose recipients → fill variables → submit form (assert request, not delivery).
- [ ] Sent history view renders.

## Permissions

- [ ] ReadOnly cannot create / send / edit templates.
