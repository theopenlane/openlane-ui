# Cross-Cutting Plan

Concerns that span pages — covered as their own specs OR layered into per-area specs as fixtures.

Tier: **0–1** depending on item.

## Session & token refresh

- [ ] Session expiration modal warns before refresh-token expiry.
- [ ] Auto-logout after expiry → redirect to `/login`.
- [ ] Visibility-change refresh: blur / focus the tab → refresh-token call fires.
- [x] Logout link clears all auth state — `(protected)` routes bounce after. _(cross-cutting.spec.ts)_

## Org switcher

- [ ] Switch org via sidebar dropdown → routes update → entity lists reflect new org.
- [ ] Active-org badge updates.
- [ ] Last-active-org persists across sessions.
- [ ] User without membership in any org sees a "create or join" CTA.

## Global search (Cmd+K / Cmd+/)

> Two distinct surfaces: Cmd+K opens the **command menu** (route navigation),
> Cmd+/ opens the **search dialog** (entity search). Both are global keyboard
> shortcuts.

- [x] Cmd+K (or Ctrl+K) opens the command menu. _(cross-cutting.spec.ts)_
- [x] Cmd+K → type a route name → Enter routes to that page (verified for "Policies"). _(cross-cutting.spec.ts)_
- [x] Cmd+/ (or Ctrl+/) opens the global search dialog. _(cross-cutting.spec.ts)_
- [ ] Search across Programs, Controls, Policies, Procedures, Evidence, Risks, Assets, Vendors, Personnel.
- [ ] Results grouped by entity.
- [ ] Click result → navigate to detail.
- [x] Esc closes the command menu. _(cross-cutting.spec.ts — covered alongside Cmd+K open)_
- [ ] Arrow keys navigate results.

## Filtering / table state

- [ ] Filters in URL state (where applicable) survive a hard refresh.
- [x] localStorage filter presets save / load — tasks search re-hydrates from localStorage after reload. _(cross-cutting.spec.ts)_
- [ ] Backend `where` clause is the only filter — no client-side slicing (assert via network or by injecting unrelated rows that wouldn't match).

## Bulk operations

- [ ] CSV import: validate → preview → confirm → bulk create.
- [ ] CSV export with filters applied.
- [ ] Bulk edit: select rows → inline edit → bulk update.

## Dialogs / modals

- [x] Esc closes a non-destructive dialog. _(cross-cutting.spec.ts — covered via the command-menu Cmd+K test)_
- [ ] Click-outside closes a non-destructive dialog (verify product rule — destructive dialogs may block).
- [ ] Confirmation dialogs require typed-name input for irreversible actions.
- [ ] Toast notifications appear on success/error and auto-dismiss.

## Permissions UI

- [ ] Buttons hidden when user lacks the action permission.
- [ ] Forced-action via API call → friendly toast error (not silent).
- [ ] Read-only views show no edit affordances.

## Navigation

- [x] Primary sidebar collapse/expand — toggle flips between PanelLeftOpen and PanelLeftClose lucide icons. _(cross-cutting.spec.ts)_
- [ ] Secondary panel collapse/expand.
- [x] Breadcrumbs reflect current route — `/policies` shows Home → Compliance → Policies. _(cross-cutting.spec.ts)_
- [x] Browser back/forward — visited routes are preserved (smoke for top-level pages). _(cross-cutting.spec.ts)_

## Theming

- [x] Dark / light theme toggle persists. _(cross-cutting.spec.ts — covers Dark across reload, and Light removes the `.dark` class across reload)_
- [ ] System-preference theme respected on first load.

## Notifications (in-app, Novu-driven)

> **Out of scope:** real Novu delivery. See
> [`00-priorities.md`](00-priorities.md). We can render the panel against
> backend-seeded notifications, not assert real-time arrival.

- [ ] Bell icon renders.
- [ ] Open panel → list renders without errors when empty.
- [ ] Open panel → seeded notifications render with correct content.
- [ ] Mark all read updates the unread badge.

## Accessibility (smoke)

- [ ] Skip-to-content link works.
- [ ] All form fields have associated labels.
- [ ] Major dialogs have ARIA roles.
- [ ] Color contrast smoke for primary CTAs.
- (Out of scope: full WCAG audit. Use axe-playwright if/when authorized.)

## Performance smoke

- [ ] Dashboard initial load under N seconds (define threshold once we have data).
- [ ] Large list (>100 rows) renders without freezing.
