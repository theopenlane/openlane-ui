# Vendor Tabbed Detail View — Checklist Plan

## Branch 1: `feat-crud-base-config` (base branch)

### CRUD Base Extensions

- [ ] Add `{ type: 'full-page'; route: string }` to `ViewEditMode` in `crud-base/types.ts`
- [ ] Add `onRowClick?: (item: TEntity) => void` to `TTableProps` in `crud-base/page.tsx`
- [ ] Add `onRowClick` to `GenericTablePageConfig` interface
- [ ] In `GenericTablePage`: when `viewEditMode.type === 'full-page'`, create `onRowClick` that navigates to `route/id`
- [ ] In `renderDetailView()`: return `null` when `resolvedViewMode === 'full-page'`
- [ ] Pass `onRowClick` prop through to `TableComponent`
- [ ] TypeScript check: `cd apps/console && npx tsc --noEmit`

---

## Branch 2: `feat/vendor-detail-view` (off branch 1)

### Phase 1: Wire Up Table Page

- [ ] Update `vendors/table/table.tsx` to use `onRowClick` prop when provided
- [ ] Add `viewEditMode: { type: 'full-page', route: '/registry/vendors' }` to table config in `vendors/table/page.tsx`
- [ ] Add `createMode: { type: 'step-dialog', steps, title: 'Create Vendor' }` to table config
- [ ] TypeScript check

### Phase 2: Create Vendor Dialog (3 Steps)

- [ ] Create `vendors/create/steps/step-vendor-info.tsx` — name, displayName, description, status, environment, scope
- [ ] Create `vendors/create/steps/step-ownership.tsx` — owner, reviewer (ResponsibilityField)
- [ ] Create `vendors/create/steps/step-upload-import.tsx` — CSV upload (FileUpload), optional contact
- [ ] Create `vendors/create/steps/vendor-create-steps.tsx` — StepConfig[] with Zod schemas per step
- [ ] Test: click "Create Vendor" button, walk through 3 steps, submit

### Phase 3: Detail Page Shell

- [ ] Create `app/(protected)/registry/vendors/[id]/page.tsx` — route entry
- [ ] Create `app/(protected)/registry/vendors/[id]/loading.tsx` — loading spinner
- [ ] Create `vendors/detail/vendor-detail-page.tsx` — main component with SlideBarLayout
- [ ] Create `vendors/detail/vendor-detail-header.tsx` — name + status badge + actions
- [ ] Create `vendors/detail/vendor-properties-sidebar.tsx` — properties panel
- [ ] Create `vendors/detail/tabs/vendor-detail-tabs.tsx` — tab orchestrator with 6 tabs
- [ ] Test: click vendor row → navigates to detail page, shows header + sidebar + tab shells

### Phase 4: Overview Tab

- [ ] Create `vendors/detail/tabs/overview/overview-tab.tsx` — description + provided services + sub-tabs
- [ ] Create `vendors/detail/tabs/overview/domains-subtab.tsx` — domain list + add domain
- [ ] Create `vendors/detail/tabs/overview/security-settings-subtab.tsx` — SSO/MFA badges
- [ ] Create `vendors/detail/tabs/overview/system-subtab.tsx` — systems table + assets list
- [ ] Create `vendors/detail/tabs/overview/link-system-dialog.tsx` — link system dialog
- [ ] Add `providedServices` field to form schema in `vendors/hooks/use-form-schema.ts`
- [ ] Test: overview tab renders description, services, sub-tabs all work

### Phase 5: Documents Tab

- [ ] Create `vendors/detail/tabs/documents/documents-tab.tsx`
- [ ] Reuse `EntityDocumentsSection` for file listing and upload
- [ ] Add columns: Category, Classified as Evidence, Mark as Evidence
- [ ] Test: documents tab shows files, upload works

### Phase 6: Contract Tab

- [ ] Create `vendors/detail/tabs/contract/contract-tab.tsx`
- [ ] Display entity contract fields in table/grid layout
- [ ] Test: contract tab shows dates, spend, auto-renew toggle

### Phase 7: Risk Review Tab

- [ ] Create `vendors/detail/tabs/risk-review/risk-review-tab.tsx`
- [ ] Alert banners (review overdue, high risk vendor)
- [ ] Risk summary cards (tier, rating, score, renewal risk)
- [ ] Edit Frequency button for reviewFrequency field
- [ ] Review History table (if API supports it)
- [ ] Test: risk review tab shows summary and alerts

### Phase 8: Contacts Tab (requires GraphQL changes)

- [ ] Add `GET_ENTITY_CONTACTS` query to `packages/codegen/query/entity.ts`
- [ ] Run `task codegen:codegen`
- [ ] Add `useGetEntityContacts` hook to `lib/graphql-hooks/entity.ts`
- [ ] Add `useCreateContact` / `useDeleteContact` to `lib/graphql-hooks/contact.ts`
- [ ] Create `vendors/detail/tabs/contacts/contacts-tab.tsx` — table + grid view toggle
- [ ] Create `vendors/detail/tabs/contacts/add-contact-dialog.tsx` — add contact form
- [ ] Test: contacts tab shows table/grid, add contact works

### Phase 9: Campaigns Tab (requires GraphQL changes)

- [ ] Extend `GET_ENTITY_ASSOCIATIONS` in `packages/codegen/query/entity.ts` with campaign `status`, `updatedAt`
- [ ] Run `task codegen:codegen`
- [ ] Create `vendors/detail/tabs/campaigns/campaigns-tab.tsx` — read-only campaign table
- [ ] Test: campaigns tab shows campaign list

### Phase 10: Polish

- [ ] Full TypeScript check: `cd apps/console && npx tsc --noEmit`
- [ ] Format: `bun run format`
- [ ] Test navigation guard (edit fields, try to navigate away)
- [ ] Test all inline editing in sidebar properties
- [ ] Test create flow end-to-end
- [ ] Test detail page with real data from backend

---

## Key Files Reference

### Existing (to modify)

| File                               | Change                        |
| ---------------------------------- | ----------------------------- |
| `shared/crud-base/types.ts`        | Add full-page ViewEditMode    |
| `shared/crud-base/page.tsx`        | Add onRowClick support        |
| `vendors/table/page.tsx`           | Add viewEditMode + createMode |
| `vendors/table/table.tsx`          | Use onRowClick prop           |
| `vendors/hooks/use-form-schema.ts` | Add providedServices          |
| `packages/codegen/query/entity.ts` | New queries                   |
| `lib/graphql-hooks/entity.ts`      | New hooks                     |
| `lib/graphql-hooks/contact.ts`     | New hooks                     |

### New (to create)

| File                                                        | Purpose                    |
| ----------------------------------------------------------- | -------------------------- |
| `app/.../vendors/[id]/page.tsx`                             | Route entry                |
| `app/.../vendors/[id]/loading.tsx`                          | Loading state              |
| `vendors/detail/vendor-detail-page.tsx`                     | Main page component        |
| `vendors/detail/vendor-detail-header.tsx`                   | Header with name + actions |
| `vendors/detail/vendor-properties-sidebar.tsx`              | Right sidebar              |
| `vendors/detail/tabs/vendor-detail-tabs.tsx`                | Tab orchestrator           |
| `vendors/detail/tabs/overview/overview-tab.tsx`             | Overview content           |
| `vendors/detail/tabs/overview/domains-subtab.tsx`           | Domains list               |
| `vendors/detail/tabs/overview/security-settings-subtab.tsx` | SSO/MFA display            |
| `vendors/detail/tabs/overview/system-subtab.tsx`            | Systems/assets             |
| `vendors/detail/tabs/overview/link-system-dialog.tsx`       | Link system dialog         |
| `vendors/detail/tabs/documents/documents-tab.tsx`           | Documents table            |
| `vendors/detail/tabs/campaigns/campaigns-tab.tsx`           | Campaigns table            |
| `vendors/detail/tabs/contract/contract-tab.tsx`             | Contract details           |
| `vendors/detail/tabs/contacts/contacts-tab.tsx`             | Contacts table/grid        |
| `vendors/detail/tabs/contacts/add-contact-dialog.tsx`       | Add contact dialog         |
| `vendors/detail/tabs/risk-review/risk-review-tab.tsx`       | Risk review                |
| `vendors/create/steps/vendor-create-steps.tsx`              | Step configs               |
| `vendors/create/steps/step-vendor-info.tsx`                 | Step 1 UI                  |
| `vendors/create/steps/step-ownership.tsx`                   | Step 2 UI                  |
| `vendors/create/steps/step-upload-import.tsx`               | Step 3 UI                  |

### Pattern References

| Pattern                       | Reference File                                  |
| ----------------------------- | ----------------------------------------------- |
| Full-page detail with sidebar | `controls/[id]/page.tsx`                        |
| Properties sidebar            | `controls/propereties-card/properties-card.tsx` |
| Tab orchestration             | `controls/tabs/tabs.tsx`                        |
| Header with actions           | `controls/control-header-actions.tsx`           |
| Navigation guard              | `controls/[id]/page.tsx` (useNavigationGuard)   |
