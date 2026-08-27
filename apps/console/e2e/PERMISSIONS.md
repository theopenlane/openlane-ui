# Permission model — as observed from the running backend

Pulled live on 2026-08-27 from a local stack (core on :17608, harmonize demo org).
Regenerate by logging in as each role and calling the endpoints named below.

## Two independent permission surfaces

The console reads permissions from two different endpoints, and they do **not**
return the same thing. Mixing them up is the single easiest way to write a
permission test that asserts the wrong expectation.

|              | endpoint                             | hook                        | scope                                 |
| ------------ | ------------------------------------ | --------------------------- | ------------------------------------- |
| org-level    | `GET /v1/account/roles/organization` | `useOrganizationRoles()`    | the caller's role in the org          |
| object-level | `POST /v1/account/roles`             | `useAccountRoles(type, id)` | the caller's FGA tuples on one object |

`AccessEnum` strings are used against **both**, so the same constant can be
granted org-wide and denied on a specific object.

### Confirmed intentional

The project owner has confirmed the split is deliberate — object-level grants are
not expected to mirror org roles. Left as-is; re-confirm before changing any gate
that depends on it.

## Org-level role matrix

Totals returned by `/v1/account/roles/organization`:

| role    | permissions |
| ------- | ----------: |
| OWNER   |         298 |
| ADMIN   |         109 |
| AUDITOR |          26 |
| MEMBER  |           4 |

Selected entries the UI gates on:

| permission             | owner | admin | member | auditor |
| ---------------------- | :---: | :---: | :----: | :-----: |
| `can_view`             |   ✓   |   ✓   |   ✓    |    —    |
| `can_view_org`         |   ✓   |   ✓   |   ✓    |    ✓    |
| `can_edit`             |   ✓   |   ✓   |   —    |    —    |
| `can_delete`           |   ✓   |   —   |   —    |    —    |
| `can_invite_members`   |   ✓   |   ✓   |   ✓    |    —    |
| `can_invite_admins`    |   ✓   |   ✓   |   —    |    —    |
| `can_manage_campaigns` |   —   |   ✓   |   —    |    —    |
| `can_manage_registry`  |   —   |   ✓   |   —    |    —    |

Two things here are counter-intuitive and have already produced wrong tests:

- **MEMBER holds `can_invite_members`.** A member sees the "Invite member"
  button. A test asserting otherwise passes only when it wins the race against
  the roles query, because `canInvite` is false while that query is pending.
- **AUDITOR is not read-only.** It can create _and delete_ evidence, findings
  and reviews. `readonly` is the console-side profile name; the backend role is
  `AUDITOR`.

Open question for the backend: ADMIN holds `can_manage_campaigns` and
`can_manage_registry` while OWNER does not.

## Object-level: trust center

From `POST /v1/account/roles` with `object_type: trust_center`:

| role     | grants                                                                     |
| -------- | -------------------------------------------------------------------------- |
| owner    | `can_edit`, `can_delete`, `can_view`, `editor`, `deleter`, `parent_editor` |
| admin    | `can_edit`, `can_view`, `editor`, `parent_editor`                          |
| member   | `can_view`                                                                 |
| readonly | `can_view`                                                                 |

Note `can_edit_trust_center_compliance` is granted to **nobody**; the framework
toggle stays enabled for owner/admin only because the component falls back to
`canEditTc` (`disabled={!canEditCompliance && !canEditTc}`).

## Enum drift

`AccessEnum` is a hand-maintained mirror of the backend's FGA relations. The FGA
model defines 300 org-level `can_*` relations; the enum names a fraction of them,
and three entries name relations that do not exist in core at all:

    can_create_job_template   can_manage_groups   can_create_scheduled_job

All three are unused, so they are noise rather than broken gates — but nothing
prevents the next drift from being a live one. The real fix already exists on the
`feat-permission-improvements-and-coverage` branch, which replaces the enum with a
generated `permissions.generated.ts` plus a CI drift gate. It is blocked on core
publishing `fga/model/generated/permissions.json`, which as of this writing 404s.

## Where the tests live

- `tests/permissions-matrix.spec.ts` — table-driven sweep, one login per role per
  worker, against pre-seeded users (see `utils/seeded-users.ts`).
- `tests/permissions.spec.ts` — older, narrative permission specs.

Credentials come from `E2E_<ROLE>_EMAIL` / `E2E_<ROLE>_PASSWORD`, defaulting to
the users `task seed:test-users` creates in harmonize. The suite never seeds
them: it expects the environment to be ready and fails with an actionable message
if it is not.
