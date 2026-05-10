# Organization Settings Plan

Routes (`(protected)/organization-settings/*`): general-settings, authentication, custom-data, billing, integrations, logs, subscribers.

Tier: **3** — high blast radius (SSO, billing) but rarely changed.

> **Coverage so far** _(organization-settings.spec.ts)_: smoke render of every sub-route (`/organization-settings`, `general-settings`, `custom-data`, `billing`, `authentication`, `integrations`, `logs`, `subscribers`) — confirms each route loads with its `<h2>` heading.

## General settings

- [ ] Edit org name → save → sidebar reflects new name.
- [ ] Edit description.
- [ ] Edit contact info (email, phone, website).
- [ ] Upload logo → preview + persist.

## Authentication (SSO/SAML)

> **Out of scope:** end-to-end SSO with a real IdP. We can test the _form_
> (validation, submit, save) but not the OAuth round-trip. See
> [`00-priorities.md`](00-priorities.md).

- [ ] SSO config form validates required fields (provider, client id, secret, discovery URL).
- [ ] Save SSO config → values persist on reload.
- [ ] Enforce-SSO toggle shows the appropriate warning copy.
- [ ] Disable SSO clears the persisted config (form fields empty).

## Custom data

- [ ] Create custom field: name + type (text / select / date / number) + apply-to-object → save.
- [ ] List custom fields with usage counts.
- [ ] Edit name / order.
- [ ] Delete custom field with confirmation (warning if data exists).

## Billing

> **Out of scope** — `subscription.enabled: false` in dev `config.yaml`. The
> billing pages render placeholder/no-op states. See
> [`00-priorities.md`](00-priorities.md).

- [ ] Page renders without errors when subscription module is disabled (smoke only).

## Integrations

> **Out of scope:** real OAuth round-trips for Slack / Jira / ServiceNow /
> Zapier. We can test the marketplace UI but not "install".

- [ ] Marketplace grid renders (smoke).
- [ ] Clicking "Install" on an integration initiates a redirect (assert navigation begins; do not follow).
- [ ] Existing integration detail page renders status + config (against a fixture row seeded via GraphQL).
- [ ] Disable / remove confirmation works on a seeded integration.

## Audit logs

- [ ] Table: timestamp, user, action, entity, changes.
- [ ] Filter by user / action type / date range.
- [ ] Export (CSV).
- [ ] Hidden by default for non-admin users.

## Subscribers (mailing list)

- [ ] Add subscriber (email).
- [ ] Remove subscriber.
- [ ] Send message to list (smoke; mock).
- [ ] Hidden for non-admins.

## Permissions

- [ ] Member (non-admin) cannot reach `/organization-settings/*` — bounce with friendly error.
- [ ] Admin can edit everything; only Owner can change billing or disable SSO (verify exact rules).
