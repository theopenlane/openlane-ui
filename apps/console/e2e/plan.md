# E2E Test Plan — Gaps

> Gap backlog generated from the per-route audit in [`COVERAGE.md`](./COVERAGE.md). Items already covered by a spec are NOT listed here. Work top-down by priority. Check items off as specs are written, and re-run the audit workflow to refresh.

**Totals:** 352 high · 478 med · 157 low · 316 blocked/out-of-scope

## 🔴 High priority (352)

### automation

- [x] `/automation/campaigns` · search functionality ✅
- [x] `/automation/campaigns` · filter by status/type/due-date ✅
- [x] `/automation/campaigns` · select single/multiple campaigns ✅
- [x] `/automation/campaigns` · bulk delete campaigns with confirmation ✅
- [ ] `/automation/campaigns` · create campaign step 1: enter name and select questionnaire template
- [ ] `/automation/campaigns` · create campaign step 2: add targets via CSV upload
- [ ] `/automation/campaigns` · save campaign as draft from stepper
- [ ] `/automation/campaigns` · launch campaign from stepper
- [ ] `/automation/campaigns` · navigate to campaign detail by clicking row
- [x] `/automation/campaigns` · detail page: start draft campaign button ✅
- [x] `/automation/campaigns` · detail page: delete campaign from menu ✅
- [x] `/automation/campaigns/[id]` · load and display campaign detail page ✅
- [ ] `/automation/campaigns/[id]` · edit campaign name with inline persist
- [ ] `/automation/campaigns/[id]` · edit campaign status dropdown
- [ ] `/automation/campaigns/[id]` · edit campaign type dropdown
- [ ] `/automation/campaigns/[id]` · edit campaign due date
- [x] `/automation/campaigns/[id]` · start campaign from draft state ✅
- [ ] `/automation/campaigns/[id]` · complete campaign from active state
- [x] `/automation/campaigns/[id]` · delete campaign and redirect to list ✅
- [x] `/automation/communications` · search email templates ✅
- [x] `/automation/communications` · filter email templates by status (All/Active/Inactive) ✅
- [x] `/automation/communications` · create email template ✅
- [ ] `/automation/communications` · edit email template
- [ ] `/automation/communications` · delete email template with confirmation
- [ ] `/automation/communications` · search notification templates
- [ ] `/automation/communications` · filter notification templates by status (All/Active/Inactive)
- [x] `/automation/communications` · create notification template ✅
- [ ] `/automation/communications` · edit notification template
- [ ] `/automation/communications` · delete notification template with confirmation
- [x] `/automation/questionnaires` · summary cards functionality and counts ✅
- [x] `/automation/questionnaires` · tab switching questionnaires to templates ✅
- [ ] `/automation/questionnaires` · search and filter questionnaires
- [x] `/automation/questionnaires` · row actions view details send edit preview delete ✅
- [ ] `/automation/questionnaires` · send questionnaire dialog email input contact suggestions validation sending
- [ ] `/automation/questionnaires` · bulk delete with checkbox selection
- [ ] `/automation/questionnaires` · pagination navigation
- [ ] `/automation/questionnaires` · column sorting
- [ ] `/automation/questionnaires/[id]` · view questionnaire name and metadata
- [ ] `/automation/questionnaires/[id]` · view recipient/response stats (recipients count, completed responses count, due date)
- [ ] `/automation/questionnaires/[id]` · send questionnaire to recipients (email addresses with contact search)
- [ ] `/automation/questionnaires/[id]` · delivery tab with table view, filter by status/sent-date/due-date, pagination, export to CSV, resend to individual recipient, view individual response details
- [ ] `/automation/questionnaires/[id]` · responses tab with table of question answers, search/filter respondents and answers by column, pagination
- [ ] `/automation/questionnaires/questionnaire-editor` · assessment-type selection (internal/external) — _No test for toggling assessment type dropdown or verifying selected value persists_
- [ ] `/automation/questionnaires/questionnaire-editor` · response-due duration selection — _No test for selecting preset durations (7/14/30/60/90 days) or verifying values persist_
- [ ] `/automation/questionnaires/questionnaire-editor` · custom date picker for response due — _No test for selecting 'Custom' duration option and using calendar popover to set date_
- [ ] `/automation/questionnaires/questionnaire-editor` · create new assessment — _No test for filling survey questions, selecting assessment type, and saving as new assessment_
- [ ] `/automation/questionnaires/questionnaire-editor` · edit existing assessment — _No test for loading existing assessment, modifying survey/duration, and saving updates_
- [ ] `/automation/questionnaires/questionnaire-viewer` · View questionnaire preview with real assessment data — _Test navigates to route without ?id param; needs seeded questionnaire ID to load actual content_
- [ ] `/automation/questionnaires/templates` · search functionality
- [ ] `/automation/questionnaires/templates` · column visibility menu
- [ ] `/automation/questionnaires/templates` · sorting
- [ ] `/automation/questionnaires/templates` · filtering (environment/scope/system-owned/date-range)
- [ ] `/automation/questionnaires/templates` · create template button
- [ ] `/automation/questionnaires/templates` · edit template action
- [ ] `/automation/questionnaires/templates` · delete template action with confirmation
- [ ] `/automation/questionnaires/templates` · permission gates (canEdit/canDelete based on system-owned)
- [ ] `/automation/questionnaires/templates/template-editor` · permission gate (non-owner redirect) — _ProtectedArea renders for non-owners; requires non-owner user context to test_
- [ ] `/automation/questionnaires/templates/template-viewer` · edit template button navigation — _button exists and clicks router.push to template-editor; not tested_
- [ ] `/automation/questionnaires/templates/template-viewer` · delete template with confirmation dialog — _delete flow including confirmation dialog and error handling; not tested_
- [ ] `/automation/tasks` · Quick filters: Completed, Open, My Tasks, Overdue, Due This Week, Unassigned — _UI rendered but not exercised in any e2e test_
- [ ] `/automation/tasks` · Sort by title, due date, status, created at, updated at — _Column header sorting not tested_
- [ ] `/automation/tasks` · Edit task (Title, Details, Status, Assignee, Due Date, Tags, Type) in detail sheet — _Detail sheet opens but edit functionality not tested_
- [ ] `/automation/tasks` · Mark task as complete — _Button present in detail sheet but not tested_
- [ ] `/automation/workflows` · view workflows list table with data — _no test exercises table rows, columns, or data rendering_
- [ ] `/automation/workflows` · search workflows by name/description — _search field exists but no test validates filtering_
- [ ] `/automation/workflows` · filter workflows by status/kind/default — _filter panel implemented but untested_
- [ ] `/automation/workflows` · row selection and bulk delete — _bulk delete UI exists but untested for workflows_
- [ ] `/automation/workflows` · edit workflow from table — _edit action exists but no test exercises it_
- [ ] `/automation/workflows` · delete single workflow — _delete action exists but untested_
- [ ] `/automation/workflows` · create workflow via wizard — _wizard navigation exists but no test completes the flow_
- [ ] `/automation/workflows/definitions/[id]` · View definition metadata and detail page rendering — _No e2e test currently exercises this detail route; smoke test missing_
- [ ] `/automation/workflows/editor` · workflow-details-form — _name/description inputs and schema type dropdown not tested_
- [ ] `/automation/workflows/editor` · workflow-settings-panel — _approval timing, cooldown, active/draft/default toggles not tested_
- [ ] `/automation/workflows/editor` · save-create-workflow — _form submission, validation, and redirect not tested_
- [ ] `/automation/workflows/inbox` · approve assignment action — _Core user action — no test verifies button click, API call, success notification, or list refresh_
- [ ] `/automation/workflows/inbox` · reject assignment with optional reason — _Core user action — no test verifies form display, reason input, confirmation, API call, or notification_
- [ ] `/automation/workflows/inbox` · request changes on assignment — _Core user action — no test verifies form display, JSON input validation, reason input, API call, or notification_
- [ ] `/automation/workflows/inbox` · reassign/add approver or reviewer — _Core user action — no test verifies user selector, dropdown, assignment, API call, or notification_
- [ ] `/automation/workflows/instances` · workflow instances table rendering with data
- [ ] `/automation/workflows/wizard` · select object type in Flow step
- [ ] `/automation/workflows/wizard` · select trigger operation (CREATE/UPDATE/DELETE)
- [ ] `/automation/workflows/wizard` · select action type goal (all 5 action types)
- [ ] `/automation/workflows/wizard` · step navigation between Flow → Refine → Configure → Review
- [ ] `/automation/workflows/wizard` · Configure step: add/remove approval targets (users/groups/resolvers)
- [ ] `/automation/workflows/wizard` · form submission creates workflow and redirects to detail
- [ ] `/automation/workflows/wizard` · validation errors prevent step progression

### controls

- [ ] `/controls` · bulk-upload-from-standard — _Dialog exists but file upload flow not tested; requires file handling_
- [ ] `/controls` · bulk-upload-custom-controls — _Dialog exists but file upload flow not tested; requires file handling_
- [ ] `/controls` · bulk-upload-control-mappings — _Dialog exists but file upload flow not tested; requires file handling_
- [ ] `/controls` · bulk-upload-update-controls — _Dialog exists in toolbar but file upload flow not tested; requires file handling_
- [ ] `/controls/[id]/[subcontrolId]/control-implementation` · view implementations list — _No e2e test navigates to /controls/[id]/[subcontrolId]/control-implementation route or exercises the main page flow_
- [ ] `/controls/[id]/[subcontrolId]/control-implementation` · create implementation — _No e2e test exercises the CreateControlImplementationSheet form submission flow_
- [ ] `/controls/[id]/[subcontrolId]/control-implementation` · edit implementation — _No e2e test exercises opening the edit sheet and updating implementation details/status/date_
- [ ] `/controls/[id]/[subcontrolId]/control-implementation` · delete implementation — _No e2e test exercises the delete/unlink action from the actions menu_
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · list control objectives with accordion
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · create control objective via sheet form
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · edit control objective via sheet form
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · delete control objective (or unlink if multi-linked)
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · link controls, subcontrols, programs, evidence, policies, procedures, risks, tasks to objective via modal
- [ ] `/controls/[id]/[subcontrolId]/edit-map-control` · load existing mapped control data — _search param mappedControlId query, form population from existing data_
- [ ] `/controls/[id]/[subcontrolId]/edit-map-control` · framework filter and control list search — _filter interactions, matched controls display_
- [ ] `/controls/[id]/[subcontrolId]/edit-map-control` · form validation and submission — _from/to required validation, update mutation, success/error notifications, redirect_
- [ ] `/controls/[id]/[subcontrolId]/map-control` · subcontrol variant route navigation — _route exists (/controls/[id]/[subcontrolId]/map-control) but never tested_
- [ ] `/controls/[id]/[subcontrolId]/map-control` · load and display preset control in From accordion
- [ ] `/controls/[id]/[subcontrolId]/map-control` · select relation type dropdown (5 options)
- [ ] `/controls/[id]/[subcontrolId]/map-control` · form validation—reject submit without From control
- [ ] `/controls/[id]/[subcontrolId]/map-control` · form validation—reject submit without To control
- [ ] `/controls/[id]/[subcontrolId]/map-control` · successful form submission creates MappedControl
- [x] `/controls/[id]/clone-control` · prefill-cloned-ref-code — _Clone-control page should auto-populate ref code with CC- prefix from source control; no test validates this behavior_ ✅
- [ ] `/controls/[id]/clone-control` · prefill-control-metadata — _Clone-control page should auto-populate description, category, subcategory, owner, delegate, controlKindName from source control; no test validates form pre-population_
- [ ] `/controls/[id]/clone-control` · submit-and-redirect — _Happy path: submit clone form and redirect to cloned control detail page; no test validates clone creation end-to-end_
- [ ] `/controls/[id]/clone-control` · permission-gating — _CanCreateControl permission gates access; the Clone button itself is gated in control-header-actions.tsx but no test validates permission checks on the clone-control route_
- [ ] `/controls/[id]/control-objectives` · View control objectives list with accordion expand/collapse
- [ ] `/controls/[id]/control-objectives` · Filter/show archived control objectives
- [ ] `/controls/[id]/control-objectives` · Create control objective via sheet dialog
- [ ] `/controls/[id]/control-objectives` · Edit control objective (in-sheet form)
- [ ] `/controls/[id]/control-objectives` · Delete control objective (if single link) or unlink (if multiple links)
- [ ] `/controls/[id]/create-subcontrol` · Happy path — create a subcontrol with Parent Control selected and land on the subcontrol detail page — _No test verifies the complete happy path for subcontrol creation with redirect to /controls/{id}/{subcontrolId}_
- [ ] `/controls/[id]/create-subcontrol` · Parent Control selection triggers auto-fill of category and subcategory — _Form logic fills form when control is selected but no test verifies this UX flow_
- [ ] `/controls/[id]/edit-map-control` · load existing mapped control via mappedControlId query param and populate form
- [ ] `/controls/[id]/edit-map-control` · save mapping (From controls + To controls + relation type + confidence + description)
- [ ] `/controls/[id]/edit-map-control` · no API seeder for creating mapped controls — _blocker: no createMappedControl helper in e2e utils_
- [ ] `/controls/[id]/map-control` · accordion expansion/collapse interaction — _core UX interaction not tested_
- [ ] `/controls/[id]/map-control` · filter panel (framework selector, category, keyword search) — _filtering logic drives control matching results_
- [ ] `/controls/[id]/map-control` · remove controls from drop zones — _core mapping interaction_
- [ ] `/controls/[id]/map-control` · form submission with validation (hasFrom/hasTo checks) — _critical business logic_
- [ ] `/controls/create-subcontrol` · create subcontrol end-to-end (fill fields, submit, redirect to detail)
- [ ] `/controls/create-subcontrol` · parent control combobox search and selection

### dashboard

- [ ] `/dashboard` · view all controls action card
- [ ] `/dashboard` · create new risk action card
- [ ] `/dashboard` · view my tasks action card
- [ ] `/dashboard` · review edit policies action card
- [ ] `/dashboard` · invite team members navigation
- [ ] `/dashboard` · secure organization navigation

### developers

- [ ] `/developers/api-tokens` · list/table of tokens with columns: name, description, scopes, expiry, last-used
- [ ] `/developers/api-tokens` · view all scopes in modal from table cell
- [ ] `/developers/api-tokens` · edit token name (disabled), description, expiry, scopes
- [ ] `/developers/api-tokens` · delete token with confirmation dialog
- [ ] `/developers/api-tokens` · filter tokens by name
- [ ] `/developers/api-tokens` · filter tokens by expiry date range
- [ ] `/developers/api-tokens` · sort tokens by name/created-at/updated-at/expires-at/is-active/last-used-at
- [ ] `/developers/api-tokens` · view table action dropdown menu per token
- [ ] `/developers/personal-access-tokens` · list/table renders tokens with correct columns
- [ ] `/developers/personal-access-tokens` · search by name (filter)
- [ ] `/developers/personal-access-tokens` · filter by expiration date range
- [ ] `/developers/personal-access-tokens` · pagination controls and navigation
- [ ] `/developers/personal-access-tokens` · edit token — update name, description, expiry, organizations
- [ ] `/developers/personal-access-tokens` · delete token — confirmation and success

### evidence

- [ ] `/evidence` · Filter evidence by program dropdown
- [ ] `/evidence` · View evidence status overview (summary card)
- [ ] `/evidence` · Bulk edit selected evidence
- [ ] `/evidence` · Bulk delete evidence
- [ ] `/evidence` · Bulk import evidence via CSV
- [ ] `/evidence` · Export evidence

### exposure

- [ ] `/exposure` · navigate to findings via quick action — _quick action card interaction not tested_
- [ ] `/exposure` · navigate to remediations via quick action — _quick action card interaction not tested_
- [ ] `/exposure` · navigate to reviews via quick action — _quick action card interaction not tested_
- [ ] `/exposure` · create remediation (permission-gated) — _sheet open not tested; requires seeder to verify permission gates_
- [ ] `/exposure` · click severity segments to filter and navigate — _main chart interaction not tested_
- [ ] `/exposure/overview` · quick actions navigation (vulnerabilities, findings, remediations, reviews)
- [ ] `/exposure/overview` · create remediation from quick actions (permission-gated)
- [ ] `/exposure/overview` · severity filter and navigation from chart segments
- [ ] `/exposure/overview` · critical exposure counts display with navigation
- [ ] `/exposure/overview` · items requiring attention table
- [ ] `/exposure/overview` · attention item row click to view associations dialog
- [ ] `/exposure/overview` · SLA menu trigger (settings button)
- [ ] `/exposure/overview` · configure SLA sheet (read/edit modes)
- [ ] `/exposure/overview` · SLA definition inline edit with enter/escape keyboard support
- [ ] `/exposure/reviews` · create review
- [ ] `/exposure/reviews` · view review detail sheet
- [ ] `/exposure/reviews` · edit review fields and save
- [ ] `/exposure/reviews` · delete review via detail sheet
- [ ] `/exposure/risks` · row selection checkbox behavior
- [ ] `/exposure/risks` · bulk delete selected risks with confirmation
- [ ] `/exposure/risks` · bulk edit dialog with multiple field types
- [ ] `/exposure/risks/[id]` · inline edit status/kind/category — _RiskLabel component renders editable badges with click handlers, similar to controls-crud inline status tests_
- [ ] `/exposure/risks/[id]` · inline rename title — _HoverPencilWrapper + Input field in RiskDetailHeader, similar to controls/policies inline edit tests_
- [ ] `/exposure/risks/[id]` · properties sidebar (stakeholder/delegate/impact/likelihood/decision/status/due-date/review/environment/scope/tags) — _Multiple form fields via RiskPropertiesSidebar, ResponsibilityField, SelectField, TextField components_
- [ ] `/exposure/risks/[id]` · quick actions (create-action-plan/start-review/set-risk-decision/mark-remediated/create-task) — _QuickActionsBar with 5 action items, some gated by canEdit; Create Task opens CreateTaskDialog_
- [ ] `/exposure/risks/create` · select risk properties (status/type/category/score/likelihood) — _PropertiesCard fields not tested in e2e_
- [ ] `/exposure/risks/create` · set authority (stakeholder/delegate) — _ResponsibilityField for authority not tested; requires group/org data_

### invite

- [ ] `/invite` · successful authenticated invite acceptance with session update

### organization

- [ ] `/organization` · switch organization — _Click 'Select' button to switch to non-active org; asserts org switch and redirect to /dashboard_
- [ ] `/organization` · create organization form submission — _Submit form with valid name/displayName; asserts creation and auto-switch to new org, redirect to /dashboard_

### organization-settings

- [x] `/organization-settings/authentication` · add-email-domain-with-validation ✅
- [ ] `/organization-settings/authentication` · display-domain-chips
- [ ] `/organization-settings/authentication` · remove-domain
- [ ] `/organization-settings/authentication` · configure-sso-switch-to-edit-mode
- [ ] `/organization-settings/authentication` · select-identity-provider
- [ ] `/organization-settings/authentication` · enter-sso-credentials
- [ ] `/organization-settings/authentication` · save-sso-configuration
- [ ] `/organization-settings/authentication` · remove-sso-with-confirmation
- [ ] `/organization-settings/custom-data` · edit-tag
- [ ] `/organization-settings/custom-data` · delete-tag
- [x] `/organization-settings/custom-data` · search-tags ✅
- [ ] `/organization-settings/custom-data` · edit-enum
- [ ] `/organization-settings/custom-data` · delete-enum
- [x] `/organization-settings/custom-data` · search-enums ✅
- [ ] `/organization-settings/custom-data` · filter-enums-by-group
- [ ] `/organization-settings/custom-data` · sort-enums
- [x] `/organization-settings/custom-data` · column-visibility-tags ✅
- [ ] `/organization-settings/custom-data` · column-visibility-enums
- [ ] `/organization-settings/custom-data` · paginate-tags
- [ ] `/organization-settings/custom-data` · paginate-enums
- [ ] `/organization-settings/general-settings` · Edit organization name and save with validation
- [ ] `/organization-settings/general-settings` · Upload and crop avatar image
- [ ] `/organization-settings/general-settings` · Transfer ownership - open dialog, select/enter email, submit and receive success notification
- [ ] `/organization-settings/general-settings` · Delete organization - open confirmation dialog, confirm with text input, and redirect to /organization page
- [ ] `/organization-settings/integrations` · view-installed-integrations-tab — _Tab switching not tested beyond tab visibility_
- [ ] `/organization-settings/integrations` · search-integrations — _No test for search functionality_
- [ ] `/organization-settings/integrations` · filter-integrations-by-tags — _No test for tag filtering or multi-select_
- [ ] `/organization-settings/integrations` · navigate-to-integration-detail — _No test for navigation to /organization-settings/integrations/[definitionId]_
- [ ] `/organization-settings/integrations` · disconnect-integration-confirmation — _No test for disconnect flow or confirmation dialog_
- [ ] `/organization-settings/integrations/[definitionId]` · navigate to specific integration definition detail page — _no e2e test navigates to /organization-settings/integrations/[definitionId]_
- [ ] `/organization-settings/integrations/[definitionId]` · view provider header with icon, name, category, description, docs link, tags
- [ ] `/organization-settings/integrations/[definitionId]` · render installed instances section with health badges and metadata
- [ ] `/organization-settings/logs` · Audit logs list/table display — _Feature not implemented (Coming Soon placeholder)_
- [ ] `/organization-settings/subscribers` · search subscribers by email
- [ ] `/organization-settings/subscribers` · filter subscribers by email/active/verified status
- [ ] `/organization-settings/subscribers` · delete subscriber with confirmation dialog
- [ ] `/organization-settings/subscribers` · bulk upload subscribers via CSV

### policies

- [ ] `/policies/[id]/view` · external reference view (file preview, replace document, switch to openlane managed) — _File upload/replace and management mode switching flows are not tested; requires seeding policy with external-reference mode and attached file_
- [ ] `/policies/create` · edit policy details (rich text editor)
- [ ] `/policies/create` · set status dropdown
- [ ] `/policies/create` · set approval required flag
- [ ] `/policies/create` · set review frequency

### procedures

- [ ] `/procedures` · row selection with checkbox — _bulk actions tested in policies-crud but not in procedures-crud_
- [ ] `/procedures` · bulk edit — _BulkEditProceduresDialog component exists but no e2e coverage_
- [ ] `/procedures` · bulk delete with confirmation — _mutation exists but no e2e test on list page (only tested on detail page)_
- [ ] `/procedures/[id]/edit` · Navigate to /procedures/[id]/edit page and verify page loads with permission check — _No direct test of the edit page route itself; only inline edits on view page tested_
- [ ] `/procedures/[id]/edit` · Edit procedure title from /edit form and persist — _Title edit tested only via inline edit on view page, not via the form on /edit page_
- [ ] `/procedures/[id]/edit` · Edit procedure details (rich text PlateEditor) from /edit form — _Procedure details editing not tested in any spec_
- [ ] `/procedures/[id]/edit` · Change procedure status from /edit form Status Card — _Status change tested only via view page inline dropdown, not via /edit form_
- [ ] `/procedures/[id]/edit` · Save edited procedure and redirect to /procedures list — _Save from /edit form not tested; only view page inline saves tested_

### programs

- [x] `/programs` · search programs by name/framework/description ✅
- [x] `/programs` · filter active vs archived programs (Tabs) ✅
- [x] `/programs/[id]` · edit program basic info (name, description, tags, framework, program owner) — _inline edit form with save/cancel, permission-gated by canEdit role_ ✅
- [ ] `/programs/[id]` · view and edit auditor details (firm, name, email) — _auditor section with edit mode, set-auditor-dialog for initial assignment_
- [ ] `/programs/[id]` · set program as ready for auditor — _set-ready-for-auditor-dialog triggered from auditor card_
- [ ] `/programs/[id]` · view timeline and readiness (status, start date, end date) — _includes status dropdown, calendar date pickers with validation_
- [ ] `/programs/[id]` · edit timeline status and dates — _edit mode with form validation (end date must be future, after start date)_
- [ ] `/programs/[id]/settings` · assign user - select, set roles, and submit — _Dialog opens but assignment flow not tested_
- [ ] `/programs/[id]/settings` · edit user role (Editor/Viewer) — _Dropdown + dialog present but not tested_
- [ ] `/programs/[id]/settings` · remove user from program with confirmation — _Action menu present but not tested_
- [x] `/programs/[id]/settings` · assign group to program — _Dialog present but not tested_ ✅
- [ ] `/programs/[id]/settings` · edit group role — _Dropdown + dialog present but not tested_
- [ ] `/programs/[id]/settings` · remove group from program — _Action menu present but not tested_
- [x] `/programs/[id]/settings` · import controls from framework (select framework, select controls, import) — _Multi-step dialog present but not tested_ ✅
- [ ] `/programs/[id]/settings` · import controls from another program — _Multi-step dialog present but not tested_
- [ ] `/programs/[id]/settings` · verify non-editor cannot see action menus — _Permission gating logic (editAllowed) present but not tested_
- [ ] `/programs/create/advanced-setup` · Step 1: Select Program Type card selection logic
- [ ] `/programs/create/advanced-setup` · Step 2: Program Name required field validation
- [ ] `/programs/create/advanced-setup` · Step 2: Framework conditional requirement for Framework type
- [ ] `/programs/create/advanced-setup` · Step 2: Date validation (end > start, future dates)
- [ ] `/programs/create/advanced-setup` · Step 2.5: SOC 2 Categories multi-select and toggle
- [ ] `/programs/create/advanced-setup` · Step 2.5: Categories empty warning message
- [ ] `/programs/create/advanced-setup` · Wizard step navigation: forward/back transitions
- [ ] `/programs/create/advanced-setup` · Wizard step skipping: conditional steps disabled
- [ ] `/programs/create/advanced-setup` · Happy path: complete all steps and create program
- [ ] `/programs/create/framework-based` · toggle category selection (SOC 2 only, skip step 1 for non-SOC 2 frameworks)
- [ ] `/programs/create/framework-based` · choose team setup path: add teammates now or skip to next step
- [ ] `/programs/create/framework-based` · add program admins (search and select users)
- [ ] `/programs/create/framework-based` · add program members (search and select users)
- [ ] `/programs/create/framework-based` · add groups with edit access (search and select groups)
- [ ] `/programs/create/framework-based` · add groups with read-only access (search and select groups)
- [ ] `/programs/create/framework-based` · select program type: Ready to Start or Gap Analysis First
- [ ] `/programs/create/framework-based` · advance through wizard steps with validation
- [ ] `/programs/create/framework-based` · create program with selected framework, categories, team members, and type
- [ ] `/programs/create/framework-based` · success notification and redirect to program detail page
- [ ] `/programs/create/risk-assessment` · Select optional framework — search frameworks and populate program name
- [ ] `/programs/create/risk-assessment` · Team setup step — add program admins/members via user multiselect
- [ ] `/programs/create/risk-assessment` · Team setup step — add groups with edit/read-only access via multiselect
- [ ] `/programs/create/risk-assessment` · Team setup step — toggle between 'Add teammates now' vs 'I'll do this later'
- [ ] `/programs/create/risk-assessment` · Associate risks step — search and multi-select risks from inventory
- [ ] `/programs/create/risk-assessment` · Complete wizard: submit to create program and redirect to detail page
- [ ] `/programs/create/risk-assessment` · Step progression through all 3 steps
- [ ] `/programs/create/soc2` · step-0-select-categories — _No test for category selection, toggling, or validation (empty selection warning)_
- [ ] `/programs/create/soc2` · step-1-team-setup — _No test for user/group selection, invite member sheet interaction, or role assignment_
- [ ] `/programs/create/soc2` · step-2-access-control — _No test for programKindName selection (Framework vs Gap Analysis) or validation_
- [ ] `/programs/create/soc2` · back-from-step-0-exit-confirm — _No test for exit confirmation dialog from first step_
- [ ] `/programs/create/soc2` · successful-program-creation — _No test for happy path: fill all steps, submit, and verify redirect to /programs/{id}_

### questionnaire

- [ ] `/questionnaire` · Submission success confirmation — _Depends on submit questionnaire flow; requires seeded assessment data_

### registry

- [ ] `/registry/assets` · create asset via slideout form
- [ ] `/registry/assets` · edit asset in detail sheet and persist changes
- [ ] `/registry/assets` · delete asset via actions menu or bulk delete
- [ ] `/registry/contacts` · create-contact-dialog — _No test for contact creation flow_
- [ ] `/registry/contacts` · edit-contact-full-form — _No test for editing contact fields in detail sheet_
- [ ] `/registry/contacts` · delete-contact — _No test for deleting a contact_
- [ ] `/registry/personnel` · search filters personnel by full name
- [ ] `/registry/personnel` · create personnel happy path (fullName + email)
- [ ] `/registry/personnel` · create personnel with required validation
- [ ] `/registry/personnel` · view personnel detail via row click
- [ ] `/registry/personnel` · edit personnel fields on detail page
- [ ] `/registry/personnel` · delete personnel with confirmation
- [ ] `/registry/personnel` · bulk select and delete personnel
- [ ] `/registry/platforms` · create platform via multi-step wizard — _wizard supports 7 steps (Basic Info, Business Purpose, Data Flow, Trust Boundary, Audit Scope, Ownership, Assets & Vendors); no e2e test covers the happy path or validation_
- [ ] `/registry/platforms` · navigate platform card to detail page — _clicking 'View Platform' button should navigate to /registry/platforms/[id]; no test covers this click_
- [ ] `/registry/platforms` · edit platform fields — _detail page supports editing all 7 form steps; no test covers edit UI, validation, or persist_
- [ ] `/registry/platforms` · delete platform with confirmation — _detail page has delete menu item + confirmation dialog; no test covers dialog flow or deletion_
- [ ] `/registry/platforms/[id]` · view-platform-overview — _No test exists for rendering platform details page; smoke test only covers list page at /registry/platforms_
- [ ] `/registry/platforms/[id]` · edit-platform — _No test for multi-step edit form (Basic Info, Business Purpose, Data Flow, Trust Boundary, Audit Scope, Ownership, Assets & Vendors)_
- [ ] `/registry/platforms/[id]` · save-platform-edits — _No API seeder for createPlatform; e2e tests cannot easily seed platform data for detail page tests_
- [ ] `/registry/system-details` · search filters results by system name
- [ ] `/registry/system-details` · filter by sensitivity level filters results
- [ ] `/registry/system-details` · filter by tags filters results
- [ ] `/registry/system-details` · create system detail via slideout
- [ ] `/registry/system-details` · view system detail in slideout
- [ ] `/registry/system-details` · edit system detail in slideout with save
- [ ] `/registry/system-details` · delete system detail via detail sheet
- [ ] `/registry/system-details` · bulk delete selected system details
- [ ] `/registry/vendors` · search filters vendors by display name
- [ ] `/registry/vendors` · filter panel exposes Status/Tags/Scope/Environment/Source Type/Relationship State/Security Questionnaire Status/MFA/SSO/SOC2 filters
- [ ] `/registry/vendors` · sorting by various columns
- [ ] `/registry/vendors` · column visibility menu toggle
- [ ] `/registry/vendors` · bulk delete vendors
- [ ] `/registry/vendors` · bulk edit vendors with predefined fields
- [ ] `/registry/vendors` · bulk create vendors from CSV
- [ ] `/registry/vendors` · export vendors data
- [ ] `/registry/vendors/[id]` · full-page edit mode — _Edit button + sidebar form with all vendor fields; no e2e test_
- [ ] `/registry/vendors/[id]` · delete vendor with confirmation — _ConfirmationDialog implemented but no e2e test exercises deletion_
- [ ] `/registry/vendors/[id]` · properties sidebar (owner/reviewer/status/tags/contract) — _VendorPropertiesSidebar with ResponsibilityField, SelectField, DateField, CheckboxField exists but no test_

### standards

- [ ] `/standards/[id]` · view standard details card (metadata: shortName, description, governing body, framework, version, revision, last updated, link, tags)
- [ ] `/standards/[id]` · view controls grouped by category in expandable accordion sections
- [ ] `/standards/[id]` · search controls by refCode, category, subcategory, or description
- [ ] `/standards/[id]` · toggle all accordion sections open/closed
- [ ] `/standards/[id]` · paginate controls within each category section
- [ ] `/standards/[id]` · click control table row to open control detail sheet via controlId query param
- [ ] `/standards/[id]` · view control detail sheet rendering (title, refCode, description, properties, subcontrols, related controls)
- [ ] `/standards/[id]` · expand and view control detail accordion sections (implementation guidance, testing procedures, evidence requests, control questions, assessment methods, assessment objectives)
- [ ] `/standards/[id]` · copy control detail sheet shareable link with controlId param

### trust-center

- [ ] `/trust-center/customer-logos` · create customer logo — _requires trust-center to exist; needs file upload capability and form validation_
- [ ] `/trust-center/customer-logos` · edit customer logo — _requires seeded customer logos; tests inline edit form, file upload, and persistence_
- [ ] `/trust-center/customer-logos` · delete customer logo with confirmation — _requires seeded customer logos; tests confirmation dialog flow_
- [ ] `/trust-center/documents` · Display document list table with pagination and sorting
- [ ] `/trust-center/documents` · Search documents by title
- [ ] `/trust-center/documents` · Filter documents by category, visibility, or standard name
- [ ] `/trust-center/documents` · Create new document with file upload
- [ ] `/trust-center/documents` · Edit document metadata (title, category, visibility, tags, standard)
- [ ] `/trust-center/documents` · Delete single document via row action menu
- [ ] `/trust-center/documents` · Click table row to open document detail sheet
- [ ] `/trust-center/updates` · Create update post — _No TrustCenter seeder — trust-center routes error when org has no configured TrustCenter row. Requires backend seed step._
- [ ] `/trust-center/updates` · Edit update post — _No TrustCenter seeder — coverage deferred pending trust-center setup (see trust-center.md)._
- [ ] `/trust-center/updates` · Delete update post with confirmation — _No TrustCenter seeder — coverage deferred pending trust-center setup (see trust-center.md)._

### user-settings

- [ ] `/user-settings` · upload and crop avatar — _file upload with crop UI and zoom controls - not covered_
- [ ] `/user-settings` · configure two-factor authentication (TOTP) — _QR code scanning, manual secret key entry - requires webauthn/browser interaction_
- [ ] `/user-settings` · enable/disable two-factor authentication — _toggle and state management - not covered_
- [ ] `/user-settings` · verify TFA with OTP code — _OTP input validation against API - requires real TOTP seed/mocking_
- [ ] `/user-settings` · add passkey — _webauthn passkey registration - requires simulator/real hardware_
- [ ] `/user-settings/profile` · edit profile name and save (form submission) — _only render tested, save flow untested_
- [ ] `/user-settings/profile` · upload and crop avatar image — _file upload + image cropping with zoom controls_
- [ ] `/user-settings/profile` · configure two-factor authentication (TFA) - generate QR code — _TOTP setup flow_
- [ ] `/user-settings/profile` · verify OTP code in TFA setup dialog (6-digit code entry) — _requires OTP validation endpoint_

## 🟡 Medium priority (478)

### automation

- [ ] `/automation/campaigns` · column visibility menu
- [ ] `/automation/campaigns` · sort by name/status/type/due-date
- [ ] `/automation/campaigns` · create campaign step 2: add targets via manual email entry
- [ ] `/automation/campaigns` · create campaign step 2: add targets via contacts selector
- [ ] `/automation/campaigns` · create campaign step 2: add targets via personnel selector
- [ ] `/automation/campaigns` · create campaign step 3: configure scheduling and reminders
- [ ] `/automation/campaigns` · detail page: inline edit campaign name
- [ ] `/automation/campaigns` · detail page: change campaign status dropdown
- [ ] `/automation/campaigns` · detail page: change campaign type dropdown
- [ ] `/automation/campaigns` · detail page: set due date
- [ ] `/automation/campaigns` · detail page: view campaign progress bar
- [ ] `/automation/campaigns` · detail page: view linked questionnaire
- [ ] `/automation/campaigns` · detail page: complete active campaign button
- [ ] `/automation/campaigns/[id]` · search recipients by name and email
- [ ] `/automation/campaigns/[id]` · click recipient to open side panel details
- [ ] `/automation/campaigns/[id]` · view campaign progress bar and stats
- [ ] `/automation/campaigns/[id]` · view questionnaires linked to campaign
- [ ] `/automation/communications` · preview email template (read-only)
- [ ] `/automation/communications` · toggle email template active/inactive
- [ ] `/automation/communications` · duplicate email template
- [ ] `/automation/communications` · filter notification templates by channel
- [ ] `/automation/communications` · filter notification templates by integrations
- [ ] `/automation/communications` · filter notification templates by workflows
- [ ] `/automation/communications` · preview notification template (read-only)
- [ ] `/automation/communications` · toggle notification template active/inactive
- [ ] `/automation/communications` · duplicate notification template
- [ ] `/automation/questionnaires` · column visibility menu toggle
- [ ] `/automation/questionnaires` · single questionnaire delete dialog
- [ ] `/automation/questionnaires` · export to CSV
- [ ] `/automation/questionnaires` · bulk upload CSV
- [ ] `/automation/questionnaires` · permission gates readonly vs edit permissions
- [ ] `/automation/questionnaires` · system-owned questionnaire not editable
- [ ] `/automation/questionnaires` · template edit duplicate create questionnaire delete
- [ ] `/automation/questionnaires/[id]` · generate public access URL for system-owned questionnaires
- [ ] `/automation/questionnaires/[id]` · preview questionnaire (link to viewer)
- [ ] `/automation/questionnaires/[id]` · edit questionnaire (non-system-owned, with edit permission)
- [ ] `/automation/questionnaires/[id]` · delete questionnaire (non-system-owned, with delete permission)
- [ ] `/automation/questionnaires/questionnaire-editor` · permission gate enforcement — _No test for non-edit users seeing ProtectedArea instead of editor_
- [ ] `/automation/questionnaires/questionnaire-editor` · system-owned assessment redirect — _No test for system-owned assessments redirecting to /automation/questionnaires_
- [ ] `/automation/questionnaires/questionnaire-editor` · success notification on save — _No test for 'Assessment created/updated successfully' notification_
- [ ] `/automation/questionnaires/questionnaire-editor` · error notification on save — _No test for error handling during assessment creation/update_
- [ ] `/automation/questionnaires/questionnaire-editor` · template*id parameter handling — \_No test for creating questionnaire from template via template_id query param*
- [ ] `/automation/questionnaires/questionnaire-viewer` · Edit questionnaire button (owner/member only, not system-owned) — _Permission gate and systemOwned check untested; requires seeded questionnaire + role check_
- [ ] `/automation/questionnaires/questionnaire-viewer` · Delete questionnaire button (owner/member only, not system-owned) — _Confirmation dialog and deletion untested; requires seeded questionnaire + API mock/response_
- [ ] `/automation/questionnaires/questionnaire-viewer` · Save as template button (owner/member, no template, not system-owned) — _Confirmation dialog and template creation untested; requires seeded questionnaire without templateID_
- [ ] `/automation/questionnaires/questionnaire-viewer` · Permission gating: Edit/Delete/Save buttons hidden for readonly users — _Readonly role behavior untested; canEdit checks not exercised_
- [ ] `/automation/questionnaires/templates` · quick filters
- [ ] `/automation/questionnaires/templates` · bulk CSV upload
- [ ] `/automation/questionnaires/templates` · export to CSV
- [ ] `/automation/questionnaires/templates` · duplicate template action
- [ ] `/automation/questionnaires/templates` · create questionnaire from template
- [ ] `/automation/questionnaires/templates` · pagination
- [ ] `/automation/questionnaires/templates` · error states (fetch failed, delete failed)
- [ ] `/automation/questionnaires/templates/template-editor` · save error handling — _parseErrorMessage and errorNotification are not exercised in tests; requires save failure scenario_
- [ ] `/automation/questionnaires/templates/template-editor` · navigation on successful save — _router.push to /automation/questionnaires/templates not tested; requires successful save_
- [ ] `/automation/questionnaires/templates/template-viewer` · permission gate - edit/delete buttons conditionally shown for non-system-owned templates with canEdit role — _conditional rendering based on canEdit() and isSystemOwned; not tested; would require seeded data with different roles_
- [ ] `/automation/tasks` · Export filtered tasks as CSV — _Export button present but not tested_
- [ ] `/automation/tasks` · Bulk CSV upload/import tasks — _Bulk Upload button present but not tested_
- [ ] `/automation/tasks` · Duplicate task with prefilled fields — _Duplicate button in detail sheet but flow not tested_
- [ ] `/automation/tasks` · Pagination through results — _Pagination controls present but not exercised in tests_
- [ ] `/automation/workflows` · column visibility toggle — _menu exists but untested_
- [ ] `/automation/workflows` · sort workflows by column — _sort functionality exists but untested_
- [ ] `/automation/workflows` · clone workflow from table — _clone action exists but untested_
- [ ] `/automation/workflows` · create workflow via editor — _editor navigation exists but untested_
- [ ] `/automation/workflows` · pagination through workflows — _pagination component exists but untested_
- [ ] `/automation/workflows` · empty state with embedded wizard — _empty state behavior untested_
- [ ] `/automation/workflows/definitions/[id]` · Toggle view modes (Visual/JSON tabs)
- [ ] `/automation/workflows/definitions/[id]` · Navigate to editor from detail page
- [ ] `/automation/workflows/definitions/[id]` · Workflow visual editor rendering in read-only mode — _Complex interactive ReactFlow component; smoke test insufficient_
- [ ] `/automation/workflows/editor` · editor-mode-toggle — _switching between visual and form editor modes not tested_
- [ ] `/automation/workflows/editor` · visual-editor-trigger-management — _drag-drop node creation, editing, deletion in visual mode not tested_
- [ ] `/automation/workflows/editor` · visual-editor-condition-management — _condition node operations in visual editor not tested_
- [ ] `/automation/workflows/editor` · visual-editor-action-management — _action node operations in visual editor not tested_
- [ ] `/automation/workflows/editor` · form-editor-trigger-management — _trigger add/remove/edit in form editor not tested_
- [ ] `/automation/workflows/editor` · form-editor-condition-management — _condition add/remove/edit in form editor not tested_
- [ ] `/automation/workflows/editor` · form-editor-action-management — _action add/remove/edit with JSON params in form editor not tested_
- [ ] `/automation/workflows/editor` · cancel-and-discard — _cancel button navigation not tested_
- [ ] `/automation/workflows/editor` · clone-workflow — _cloneFrom query param workflow duplication not tested_
- [ ] `/automation/workflows/editor` · create-from-template — _template query param initialization not tested_
- [ ] `/automation/workflows/inbox` · organize assignments by section (Approvals/Reviews/Changes Requested) — _No test verifies section headers, badge counts, or categorization logic_
- [ ] `/automation/workflows/inbox` · open object link from change request — _Navigation action present in code but untested_
- [ ] `/automation/workflows/inbox` · form validation (invalid JSON for change request inputs) — _Error notification displayed but not tested_
- [ ] `/automation/workflows/instances` · status badge display and styling
- [ ] `/automation/workflows/instances` · assignment counts display (Pending, Approved, Rejected, Changes)
- [ ] `/automation/workflows/instances` · loading state rendering
- [ ] `/automation/workflows/templates` · click template card and navigate to wizard with template parameter — _template selection flow not tested; verifies template-driven wizard entry_
- [ ] `/automation/workflows/templates` · verify template grid renders with all templates — _no assertion on template card visibility or count_
- [ ] `/automation/workflows/templates` · click 'Open wizard' button and navigate to wizard without template — _entry point to blank wizard from templates page not tested_
- [ ] `/automation/workflows/templates` · click 'Start from scratch' card and navigate to wizard — _alternative blank wizard entry point not tested_
- [ ] `/automation/workflows/wizard` · Back button navigation and step skipping
- [ ] `/automation/workflows/wizard` · Refine step: toggle between Any/Specific fields
- [ ] `/automation/workflows/wizard` · Refine step: select tracked fields (UPDATE trigger)
- [ ] `/automation/workflows/wizard` · Refine step: add/remove edge changes
- [ ] `/automation/workflows/wizard` · Refine step: enable/configure condition (simple and CEL modes)
- [ ] `/automation/workflows/wizard` · Configure step: set approval label and required count
- [ ] `/automation/workflows/wizard` · Configure step: set approval timing (PRE_COMMIT vs POST_COMMIT)
- [ ] `/automation/workflows/wizard` · Configure step: add notification recipients and set channels
- [ ] `/automation/workflows/wizard` · Configure step: configure webhook URL/method/payload
- [ ] `/automation/workflows/wizard` · Configure step: configure field update (field selection/value)
- [ ] `/automation/workflows/wizard` · Review step: enter workflow name and description
- [ ] `/automation/workflows/wizard` · Review step: toggle active/draft/default flags and set cooldown
- [ ] `/automation/workflows/wizard` · template loading via ?template query param pre-fills form
- [ ] `/automation/workflows/wizard` · step enablement depends on required fields

### controls

- [ ] `/controls` · filter-by-framework-on-dashboard — _Filter UI exists and updates data, but no e2e test confirms the filter persistence or interaction_
- [ ] `/controls` · expand-collapse-categories — _Expand/collapse all button exists, but no e2e test confirms interaction_
- [ ] `/controls` · column-visibility-menu — _Menu component exists but no e2e test confirms interaction_
- [ ] `/controls` · export-controls-csv — _Export function exists but no e2e test confirms export button interaction and download_
- [ ] `/controls` · bulk-select-controls — _Row selection exists conditionally but no e2e test confirms multi-select interaction_
- [ ] `/controls` · bulk-edit-controls — _BulkEditControlsDialog component exists but no e2e test for bulk edit flow_
- [ ] `/controls` · bulk-delete-controls — _Bulk delete confirmation and API call exist but no e2e test for the table-view bulk delete interaction_
- [ ] `/controls/[id]` · update description with rich editor (Plate) — _description field updates tested only via direct form-level updates in edit mode; inline rich editor interaction not covered_
- [ ] `/controls/[id]` · update delegate/owner/responsible party fields — _properties card has person field selectors but no e2e coverage of their selection/update flow_
- [ ] `/controls/[id]` · quick actions: add implementation sheet — _CreateControlImplementationSheet triggered but no e2e coverage of sheet submission_
- [ ] `/controls/[id]` · quick actions: add objective sheet — _CreateControlObjectiveSheet triggered but no e2e coverage_
- [ ] `/controls/[id]` · quick actions: upload evidence sheet — _EvidenceCreateSheet triggered but covered elsewhere in evidence.spec; control detail context not tested_
- [ ] `/controls/[id]` · quick actions: create task — _CreateTaskDialog triggered with control pre-filled but no control-detail-specific e2e coverage_
- [ ] `/controls/[id]/[subcontrolId]/control-implementation` · mark verified/not verified — _No e2e test exercises toggling the verified status via the action menu_
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · unarchive control objective
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · toggle show archived checkbox
- [ ] `/controls/[id]/[subcontrolId]/edit-map-control` · mapping type selection with icon update — _relation type dropdown, visual icon update_
- [ ] `/controls/[id]/[subcontrolId]/edit-map-control` · confidence slider adjustment — _slider interaction, percentage value display_
- [ ] `/controls/[id]/[subcontrolId]/edit-map-control` · delete mapped control via relations card — _delete button, confirmation dialog, success/error handling_
- [ ] `/controls/[id]/[subcontrolId]/map-control` · filter controls by framework dropdown
- [ ] `/controls/[id]/[subcontrolId]/map-control` · filter controls by category dropdown
- [ ] `/controls/[id]/[subcontrolId]/map-control` · search controls by keyword text input
- [ ] `/controls/[id]/[subcontrolId]/map-control` · toggle include subcontrols checkbox
- [ ] `/controls/[id]/[subcontrolId]/map-control` · clear filters link
- [ ] `/controls/[id]/[subcontrolId]/map-control` · expand/collapse matched controls accordion groups
- [ ] `/controls/[id]/[subcontrolId]/map-control` · adjust confidence slider and observe icon change
- [ ] `/controls/[id]/[subcontrolId]/map-control` · enter relation description in textarea
- [ ] `/controls/[id]/[subcontrolId]/map-control` · success notification shown after creation
- [ ] `/controls/[id]/[subcontrolId]/map-control` · error notification on form submission failure
- [ ] `/controls/[id]/[subcontrolId]/map-control` · cancel button returns to previous page
- [ ] `/controls/[id]/[subcontrolId]/map-control` · remove dropped control via X button on chip
- [ ] `/controls/[id]/clone-control` · edit-title — _Title field is editable in clone form; no test covers title entry/edit in cloning context_
- [ ] `/controls/[id]/clone-control` · edit-description — _Description via Plate editor; no test covers description editing in clone context_
- [ ] `/controls/[id]/clone-control` · edit-properties — _Properties card (owner, delegate, responsible party, tags, etc.) editable in clone form; no test covers property editing during clone_
- [ ] `/controls/[id]/clone-control` · create-objective — _Optional Create Control Objective checkbox with Plate editor; no test covers objective creation during clone_
- [ ] `/controls/[id]/clone-control` · create-implementation — _Optional Create Control Implementation checkbox with Plate editor; no test covers implementation creation during clone_
- [ ] `/controls/[id]/clone-control` · add-related-controls — _Related Controls section with MapControlDialog; the clone URL includes mapControlId query param to pre-populate mapped controls; no test validates this_
- [ ] `/controls/[id]/control-objectives` · Link related objects to control objective (controls, subcontrols, programs, evidence, policies, procedures, risks, tasks)
- [ ] `/controls/[id]/control-objectives` · Archive/unarchive control objective
- [ ] `/controls/[id]/control-objectives` · Permission-gated actions based on user role (canEdit)
- [ ] `/controls/[id]/create-subcontrol` · Create Control Objective optional flow — enable checkbox and fill description — _Switch toggle and rich text editor for objective creation not tested_
- [ ] `/controls/[id]/create-subcontrol` · Create Control Implementation optional flow — enable checkbox and fill details — _Switch toggle and rich text editor for implementation details not tested_
- [ ] `/controls/[id]/create-subcontrol` · Create multiple toggle — reset form preserving owner/delegate/category/subcategory/kind/source — _Create multiple feature allows rapid batch creation but no test covers it_
- [ ] `/controls/[id]/create-subcontrol` · Description editor interaction — focus, paste, format text in PlateEditor — _Rich text editor for description is component-tested but not e2e_
- [ ] `/controls/[id]/create-subcontrol` · Related Controls mapping — open dialog, search, filter by framework, select controls/subcontrols, save — _Related Controls card with mapping dialog exists but no e2e test covers the mapping flow_
- [ ] `/controls/[id]/edit-map-control` · validation: error when From or To controls missing
- [ ] `/controls/[id]/edit-map-control` · search and filter controls by framework/category/keyword
- [ ] `/controls/[id]/edit-map-control` · remove controls from From/To zones
- [ ] `/controls/[id]/edit-map-control` · test subcontrol variant (/controls/[id]/[subcontrolId]/edit-map-control)
- [ ] `/controls/[id]/map-control` · subcontrol toggle enabling — _conditional query enabling_
- [ ] `/controls/[id]/map-control` · relation type selection — _form field interaction_
- [ ] `/controls/[id]/map-control` · confidence slider interaction — _form field with custom slider_
- [ ] `/controls/[id]/map-control` · matched controls list filtering by framework/keyword — _derived from filter state_
- [ ] `/controls/create-control` · Fill Title field
- [ ] `/controls/create-control` · Edit Description with Plate editor
- [ ] `/controls/create-control` · Toggle Create Control Objective and fill outcome
- [ ] `/controls/create-control` · Toggle Create Control Implementation and fill details
- [ ] `/controls/create-control` · Cancel and redirect to controls list
- [ ] `/controls/create-control` · Create Multiple toggle preserves fields
- [ ] `/controls/create-control` · Set Owner via Properties Card
- [ ] `/controls/create-control` · Set Delegate via Properties Card
- [ ] `/controls/create-control` · Set Responsible Party via Properties Card
- [ ] `/controls/create-control` · Set Category via Properties Card
- [ ] `/controls/create-control` · Set Subcategory via Properties Card
- [ ] `/controls/create-control` · Set Status via Properties Card
- [ ] `/controls/create-control` · Set Source via Properties Card
- [ ] `/controls/create-control` · Set Type/Kind via Properties Card
- [ ] `/controls/create-control` · Add/edit Tags via Properties Card
- [ ] `/controls/create-control` · Set Reference ID via Properties Card
- [ ] `/controls/create-control` · Set Auditor Reference ID via Properties Card
- [ ] `/controls/create-control` · Map Related Controls via dialog
- [ ] `/controls/create-control` · Link Associated Objects
- [ ] `/controls/create-subcontrol` · edit description with PlateEditor
- [ ] `/controls/create-subcontrol` · toggle and edit control objective
- [ ] `/controls/create-subcontrol` · toggle and edit control implementation
- [ ] `/controls/create-subcontrol` · edit authority properties (status, category, subcategory, tags, owner, delegate)
- [ ] `/controls/create-subcontrol` · map related controls via dialog (search, filter, checkbox selection, save)
- [ ] `/controls/create-subcontrol` · link and unlink associated objects (policies, procedures, tasks, etc.)
- [ ] `/controls/create-subcontrol` · permission gating when user lacks CanCreateSubcontrol
- [ ] `/controls/create-subcontrol` · error handling on form submission failure

### dashboard

- [ ] `/dashboard` · display compliance overview metrics
- [ ] `/dashboard` · navigate to controls with filter from compliance overview
- [ ] `/dashboard` · navigate to evidence with filter from compliance overview
- [ ] `/dashboard` · navigate to tasks with filter from compliance overview
- [ ] `/dashboard` · navigate to risks with filter from compliance overview
- [ ] `/dashboard` · display suggested actions section
- [ ] `/dashboard` · import policies dialog trigger

### developers

- [ ] `/developers/api-tokens` · view token in success screen and copy to clipboard — _test reaches success screen but does not verify token display or copy action_
- [ ] `/developers/api-tokens` · pagination of token list
- [ ] `/developers/api-tokens` · view scope violation warning when excessive scopes (>20 write/delete) — _depends on seeded data with high-scope token_
- [ ] `/developers/api-tokens` · inline edit scopes from scope violation callout in modal — _depends on seeded data with high-scope token_
- [ ] `/developers/api-tokens` · view table column: no-expiration warning tooltip
- [ ] `/developers/personal-access-tokens` · sort by each field (expires_at, is_active, last_used_at, name, created_at, updated_at)
- [ ] `/developers/personal-access-tokens` · copy newly created token to clipboard
- [ ] `/developers/personal-access-tokens` · create token — validation errors (empty name, no org selected, invalid expiry)
- [ ] `/developers/personal-access-tokens` · create token — set custom expiration date
- [ ] `/developers/personal-access-tokens` · action menu visibility based on canEdit permission

### evidence

- [ ] `/evidence` · Inline edit evidence fields (double-click)
- [ ] `/evidence` · Renew evidence
- [ ] `/evidence` · View suggested actions (unlinked, needs review, needs renewal)
- [ ] `/evidence` · Copy evidence link to clipboard
- [ ] `/evidence` · Add/manage evidence comments
- [ ] `/evidence` · Manage evidence file attachments

### exposure

- [ ] `/exposure` · click critical count filters — _secondary navigation flow_
- [ ] `/exposure` · click item row to open associations/timeline dialog — _detail interaction pattern not tested_
- [ ] `/exposure` · open item detail sheet from attention table — _requires seeded critical/high items_
- [ ] `/exposure` · view association graph — _complex component, requires detail item interaction_
- [ ] `/exposure` · view association timeline — _requires detail item interaction_
- [ ] `/exposure` · open see all activity sheet — _sheet trigger interaction_
- [ ] `/exposure` · click activity item to view details — _requires seeded recent activity_
- [ ] `/exposure` · configure SLA settings menu — _menu trigger + sheet interaction_
- [ ] `/exposure` · edit SLA definitions (permission-gated) — _form submission pattern; requires seeded SLA definitions_
- [ ] `/exposure/overview` · severity chart visualization with hover tooltips
- [ ] `/exposure/overview` · recent activity feed (30-day preview, 5 items)
- [ ] `/exposure/overview` · view all activity sheet (30-day full list)
- [ ] `/exposure/overview` · activity item detail views (vulnerability, finding, scan, review, risk)
- [ ] `/exposure/overview` · attention item associations graph and connections
- [ ] `/exposure/overview` · attention item timeline tab
- [ ] `/exposure/overview` · view detailed items from attention dialog (vulnerability/finding/risk sheets)
- [ ] `/exposure/overview` · SLA validation (non-negative numbers, max 365 days)
- [ ] `/exposure/remediations` · bulk CSV import — _file upload — requires test fixture/mock_
- [ ] `/exposure/reviews` · search filters reviews by title/summary
- [ ] `/exposure/reviews` · sort table by different fields
- [ ] `/exposure/reviews` · column visibility toggle
- [ ] `/exposure/reviews` · bulk delete reviews
- [ ] `/exposure/reviews` · bulk edit reviews
- [ ] `/exposure/reviews` · inline edit tags on detail sheet
- [ ] `/exposure/reviews` · link/unlink associated objects (controls, subcontrols, remediations, entities, tasks, assets, programs, risks) — _requires review seeding via API_
- [ ] `/exposure/risks` · sort by name/score/status/created/updated date
- [ ] `/exposure/risks` · pagination controls (next/prev/page selection)
- [ ] `/exposure/risks` · inline edit delegate cell (update and clear)
- [ ] `/exposure/risks` · inline edit stakeholder cell (update and clear)
- [ ] `/exposure/risks` · export to CSV with visible columns
- [ ] `/exposure/risks` · bulk upload CSV file creation flow — _file upload not directly seeded_
- [ ] `/exposure/risks` · filter by category
- [ ] `/exposure/risks` · filter by impact/likelihood
- [ ] `/exposure/risks` · filter by type
- [ ] `/exposure/risks` · permission gate: non-owners cannot create/edit
- [ ] `/exposure/risks/[id]` · risk review tab (frequency/overdue-alerts/high-risk-alerts) — _RiskReviewTab renders alerts, frequency dropdown, search/filter on reviews table_
- [ ] `/exposure/risks/create` · fill risk details (rich text) — _PlateEditor integration not covered; no tests for content input_
- [ ] `/exposure/risks/create` · fill business costs (rich text) — _PlateEditor integration not covered; no tests for content input_
- [ ] `/exposure/risks/create` · add tags — _MultipleSelector for tags not tested; requires tag definitions_
- [ ] `/exposure/scans/domain-scan` · exit wizard - review later button

### forgot-password

- [ ] `/forgot-password` · error message display for network/API failures — _Component has error state (lines 19, 34, 50, 62, 68) but no e2e test asserts the error path_
- [ ] `/forgot-password` · recaptcha validation failure — _Component handles reCAPTCHA errors (lines 40-52) but no test covers validation failure path_

### invite

- [ ] `/invite` · loading state display
- [ ] `/invite` · invalid or expired invite error UI
- [ ] `/invite` · SSO enforcement redirect when needs_sso is true

### login

- [ ] `/login` · URL error parameter ?error=<message> displays and clears — _Error parameter handling exists but not tested_

### onboarding

- [ ] `/onboarding` · Company Info step: Company size selection — _Size dropdown present in code but never asserted in tests; no verification of selection or persistence_
- [ ] `/onboarding` · User Info step: Role input - data capture and persistence — _Role field exists but never tested for value entry, validation, or retention across navigation_
- [ ] `/onboarding` · User Info step: Department selection — _Department dropdown present in code but never asserted; no selection or persistence test_
- [ ] `/onboarding` · Compliance Info step: Risk assessment toggle — _Step 3 exists and toggle controls exist in code, but toggle interaction/persistence never tested_
- [ ] `/onboarding` · Compliance Info step: Gap analysis toggle — _Step 3 exists and toggle controls exist in code, but toggle interaction/persistence never tested_
- [ ] `/onboarding` · Compliance Info step: Existing controls toggle — _Step 3 exists and toggle controls exist in code, but toggle interaction/persistence never tested_
- [ ] `/onboarding` · Compliance Info step: Existing policies/procedures toggle — _Step 3 exists and toggle controls exist in code, but toggle interaction/persistence never tested_
- [ ] `/onboarding` · Compliance Info step: Demo request toggle — _Demo request toggle on Step 3 present in code but never tested for interaction or submission inclusion_
- [ ] `/onboarding` · Step 2 field validation before advancing to Step 3 — _Step 2 validation logic exists (triggers role/department fields) but no test for advancing with invalid data_
- [ ] `/onboarding` · Early exit link completion — _Exit link visibility tested but not clicking it to submit with early-exit behavior_

### organization

- [ ] `/organization` · form validation (name field) — _Test min 2 chars and max 32 chars validation on name field_
- [ ] `/organization` · form validation (displayName field) — _Test min 2 chars validation on displayName field_
- [ ] `/organization` · auto-populate displayName from name — _Verify onChangeCapture on name field auto-sets displayName value_

### organization-settings

- [ ] `/organization-settings/authentication` · toggle-auto-join-switch
- [ ] `/organization-settings/authentication` · enter-oidc-discovery-endpoint
- [ ] `/organization-settings/authentication` · toggle-sso-enforcement
- [ ] `/organization-settings/authentication` · cancel-sso-edit
- [ ] `/organization-settings/billing` · edit billing email — _GraphQL mutation + form validation_
- [ ] `/organization-settings/billing` · edit billing address with Google Maps autocomplete — _Google Maps API required_
- [ ] `/organization-settings/billing` · permission gate — member/readonly access denied — _requires non-owner user fixture_
- [ ] `/organization-settings/custom-data` · copy-tag-link
- [ ] `/organization-settings/custom-data` · inline-edit-tag-color
- [ ] `/organization-settings/custom-data` · inline-edit-enum-color
- [ ] `/organization-settings/custom-data` · permission-gate-edit-delete-tags
- [ ] `/organization-settings/custom-data` · permission-gate-create-edit-enums
- [ ] `/organization-settings/general-settings` · Validation errors - form validation messages and API error handling
- [ ] `/organization-settings/general-settings` · Permission gate - members see ProtectedArea, not editable content
- [ ] `/organization-settings/integrations` · trigger-health-check — _No test for health check button and status update_
- [ ] `/organization-settings/integrations` · open-configure-dialog — _No test for configure button opening dialog, requires provider with user input schema_
- [ ] `/organization-settings/integrations` · install-integration-form-flow — _Form-based installation with credential selection - requires provider seeding or mock data_
- [ ] `/organization-settings/integrations` · select-credential-for-installation — _No test for credential accordion/selection on detail page - requires provider with multiple credential schemas_
- [ ] `/organization-settings/integrations/[definitionId]` · health check button triggers refetch and updates status badge
- [ ] `/organization-settings/integrations/[definitionId]` · configure instance button opens configuration dialog for existing installation
- [ ] `/organization-settings/integrations/[definitionId]` · disconnect button shows confirmation and completes disconnect flow
- [ ] `/organization-settings/integrations/[definitionId]` · operations table displays with permissions expandable rows
- [ ] `/organization-settings/integrations/[definitionId]` · webhook configuration section displays and dismiss button works
- [ ] `/organization-settings/integrations/[definitionId]` · credential selection accordion expands/collapses per method
- [ ] `/organization-settings/integrations/[definitionId]` · form-based credential submission and validation — _requires test seeder data for integration providers with credentialSchemas_
- [ ] `/organization-settings/integrations/[definitionId]` · permission gate shows readonly callout when user lacks canManage
- [ ] `/organization-settings/logs` · Log entry filtering and search — _Feature not implemented (Coming Soon placeholder)_
- [ ] `/organization-settings/logs` · Log detail view/expansion — _Feature not implemented (Coming Soon placeholder)_
- [ ] `/organization-settings/subscribers` · sort by created/updated/email/active fields
- [ ] `/organization-settings/subscribers` · paginate through subscriber list
- [ ] `/organization-settings/subscribers` · export subscribers to CSV

### password-reset

- [ ] `/password-reset` · Empty password fields submission — _HTML5 required attrs prevent submission, but explicit test missing_

### policies

- [ ] `/policies` · filter-by-approver — _Filter dropdown in dashboard (Approver checkbox filter) exists in code but no e2e test_
- [ ] `/policies` · policy-suggested-actions — _Popover with badge count, approval/assign/review actions - not tested_
- [ ] `/policies` · status-breakdown-clickthrough — _Dashboard status breakdown card should filter table - no test_
- [ ] `/policies` · coverage-by-type-clickthrough — _Dashboard coverage by type card should filter table - no test_
- [ ] `/policies` · import-document — _Import existing document upload flow in table toolbar - no test_
- [ ] `/policies` · bulk-upload-csv — _Bulk CSV upload dialog in table toolbar - no test_
- [ ] `/policies` · export-csv — _Export table to CSV (button exists in toolbar) - no test_
- [ ] `/policies/[id]/view` · form edit mode (bulk metadata edit + save/cancel) — _No test exercises the form-based edit mode that opens the sidebar with Save/Cancel buttons and allows editing approver/delegate/tags/review fields together_
- [ ] `/policies/[id]/view` · properties card (tags, approval required, frequency, review due) — _No test verifies inline or form editing of tags, approval-required toggle, review frequency, or review-due date_
- [ ] `/policies/[id]/view` · authority card (approver/delegate selection) — _No test covers selection or clearing of approver/delegate fields in the authority card_
- [ ] `/policies/[id]/view` · history tab restore functionality — _History tab is tested for Current badge existence, but no test exercises the restore-to-past-version dialog and confirmation_
- [ ] `/policies/[id]/view` · manage permissions sheet (open/close) — _No test opens the Manage Permissions sheet or verifies permission model visibility_
- [ ] `/policies/create` · set policy type with creatable custom enum
- [ ] `/policies/create` · set review date with calendar
- [ ] `/policies/create` · add/edit tags with creation
- [ ] `/policies/create` · set approver group via authority card
- [ ] `/policies/create` · set delegate group via authority card
- [ ] `/policies/create` · associate objects during create (link procedures/controls/etc.)
- [ ] `/policies/create` · create multiple toggle - clear name/details, keep metadata

### procedures

- [ ] `/procedures` · sorting — _no e2e test for column header sort functionality_
- [ ] `/procedures` · pagination — _no e2e test for pagination controls (next/prev/page size)_
- [ ] `/procedures` · create button (permission-gated) — _create tested but not permission gating on list page_
- [ ] `/procedures` · import existing document via dialog — _CreateProcedureUploadDialog exists but no e2e coverage_
- [ ] `/procedures` · bulk CSV upload (permission-gated) — _BulkCSVCreateProcedureDialog exists but no e2e coverage_
- [ ] `/procedures` · export to CSV — _export functionality exists but no e2e test coverage_
- [ ] `/procedures/[id]/edit` · Change approval required toggle from /edit form — _Approval required field has no test coverage_
- [ ] `/procedures/[id]/edit` · Change review frequency from /edit form — _Review frequency selection not tested_
- [ ] `/procedures/[id]/edit` · Set review due date from /edit form calendar picker — _Review due date picker not tested_
- [ ] `/procedures/[id]/edit` · Change procedure type (kind) creatable enum select — _Procedure kind/type selection not tested_
- [ ] `/procedures/[id]/edit` · Add tags to procedure from /edit form Tags Card — _Tags management not tested on procedure forms_
- [ ] `/procedures/[id]/edit` · Set approver group from /edit Authority Card — _Approver/delegate selection not tested in /edit form_
- [ ] `/procedures/[id]/edit` · Set delegate group from /edit Authority Card — _Approver/delegate selection not tested in /edit form_
- [ ] `/procedures/[id]/edit` · Error handling on save (validation, GraphQL errors) — _No error scenarios tested on procedure forms_
- [ ] `/procedures/[id]/edit` · Permission denial: readonly user cannot access /edit page — _Permission gating logic exists (canEdit check) but no e2e test covers denial_
- [ ] `/procedures/[id]/view` · bulk-edit-mode — _Full form edit mode (Save/Cancel buttons) tested for create but not detail view_
- [ ] `/procedures/[id]/view` · inline-approver-edit — _Approver searchable single select inline edit not covered_
- [ ] `/procedures/[id]/view` · inline-delegate-edit — _Delegate searchable single select inline edit not covered_
- [ ] `/procedures/[id]/view` · inline-tags-edit — _Tags multi-select inline edit not covered_
- [ ] `/procedures/[id]/view` · manage-permissions — _ManagePermissionSheet flow not covered in e2e_
- [ ] `/procedures/[id]/view` · edit-details-rich-text — _Rich text editor (Plate) in details field not covered; includes discussion/collaboration features_
- [ ] `/procedures/create` · create-procedure-with-full-form — _title and save tested; details (Plate editor), approval-required, status, review-frequency, review-date, tags, procedure-type not tested in create flow_
- [ ] `/procedures/create` · set-approval-required — _form field exists; no e2e coverage_
- [ ] `/procedures/create` · set-procedure-type — _creatable enum select in form; no e2e coverage_
- [ ] `/procedures/create` · set-review-frequency — _status card field; no e2e coverage_
- [ ] `/procedures/create` · set-review-date — _calendar popover in status card; no e2e coverage_
- [ ] `/procedures/create` · add-tags — _MultipleSelector in tags card; no e2e coverage_
- [ ] `/procedures/create` · add-rich-text-details — _Plate editor integration; no e2e coverage_

### programs

- [ ] `/programs` · expand/collapse individual framework groups
- [ ] `/programs` · expand/collapse all accordion groups (Switch toggle)
- [ ] `/programs` · view program metrics (evidence %, tasks, controls)
- [ ] `/programs` · display program owner and status
- [ ] `/programs` · unarchive archived program from dashboard card
- [ ] `/programs` · navigate to program detail via View button
- [ ] `/programs` · navigate to program settings via menu
- [ ] `/programs` · assign users to program (permission-gated: editAllowed)
- [ ] `/programs/[id]` · view evidence stats cards with trends — _three cards: submitted, accepted, rejected with percentage/count/total and week-over-week trends_
- [ ] `/programs/[id]` · click stats cards to navigate to evidence with filters — _each card is a link to /evidence?programId=[id]& with status filter saved_
- [ ] `/programs/[id]` · view outstanding tasks table with sorting — _table shows title, type, status, due date, assignee with default sort by due date ASC_
- [ ] `/programs/[id]` · click task title to navigate to /automation/tasks?id=[taskId] — _in-page task link_
- [ ] `/programs/[id]` · click Settings menu button to navigate to /programs/[id]/settings — _menu-triggered link_
- [ ] `/programs/[id]/settings` · search/filter users in assign user dialog — _Search input present but interaction not tested_
- [ ] `/programs/[id]/settings` · search/filter groups in assign dialog — _Search input present but interaction not tested_
- [ ] `/programs/[id]/settings` · verify archived program hides assign/import buttons — _Status-dependent UI not tested_
- [ ] `/programs/create/advanced-setup` · Step 3: Audit Information form entry
- [ ] `/programs/create/advanced-setup` · Step 4: Program Members multi-select (users)
- [ ] `/programs/create/advanced-setup` · Step 4: Program Admins multi-select (users)
- [ ] `/programs/create/advanced-setup` · Step 4: Groups with Edit/Read-Only Access multi-select
- [ ] `/programs/create/advanced-setup` · Step 4: Invite member sheet integration
- [ ] `/programs/create/advanced-setup` · Step 5: Associate Existing Risks multi-select
- [ ] `/programs/create/advanced-setup` · Step 5: Associate Existing Policies multi-select
- [ ] `/programs/create/advanced-setup` · Step 5: Associate Existing Procedures multi-select
- [ ] `/programs/create/advanced-setup` · Form data persistence: forward/back navigation retains values
- [ ] `/programs/create/advanced-setup` · Exit wizard confirmation: Back on Step 1 shows dialog
- [ ] `/programs/create/advanced-setup` · Error handling: GraphQL mutation failures
- [ ] `/programs/create/framework-based` · auto-populate program name based on selected framework and year
- [ ] `/programs/create/framework-based` · show warning when no categories selected
- [ ] `/programs/create/framework-based` · navigate back through steps
- [ ] `/programs/create/framework-based` · exit wizard from step 0 with confirmation dialog
- [ ] `/programs/create/framework-based` · error notification on create failure
- [ ] `/programs/create/generic-program` · program-type-validation — _Required validation for Program Type field not explicitly tested_
- [ ] `/programs/create/generic-program` · error-notification-on-create-failure — _GraphQL error handling/error notification not tested_
- [ ] `/programs/create/risk-assessment` · Form validation: required fields/conditional validation per step
- [ ] `/programs/create/risk-assessment` · Exit confirmation on back from step 0 to return to /programs/create
- [ ] `/programs/create/soc2` · step-navigation-next — _No test for stepping through all 3 steps sequentially_
- [ ] `/programs/create/soc2` · error-handling-creation-failure — _No test for error notifications on creation failure_
- [ ] `/programs/create/soc2` · form-validation-programKindName — _No test for required field validation error messages_

### registry

- [ ] `/registry/assets` · bulk operations (bulk delete, bulk edit, bulk CSV create)
- [ ] `/registry/assets` · filter by multiple filter types (Subtype, Source Type, PII, Data Classification, etc.)
- [ ] `/registry/assets` · column visibility toggle
- [ ] `/registry/assets` · export table to CSV
- [ ] `/registry/assets` · link/unlink associations (controls, policies, entities, scans, identity holders)
- [ ] `/registry/contacts` · filter-by-tags — _Tags filter exists in code but not tested (Status filter is tested)_
- [ ] `/registry/contacts` · bulk-delete-selected — _No test for bulk delete operation_
- [ ] `/registry/contacts` · bulk-edit-selected-contacts — _No test for bulk edit (status/company/title)_
- [ ] `/registry/contacts` · bulk-csv-import — _No test for CSV import functionality_
- [ ] `/registry/contacts` · export-contacts — _No test for export functionality_
- [ ] `/registry/personnel` · bulk edit personnel status
- [ ] `/registry/personnel` · bulk create from CSV upload
- [ ] `/registry/personnel` · export personnel table
- [ ] `/registry/personnel` · filter by Type, Active, Openlane User, Environment, Scope, Tags
- [ ] `/registry/personnel` · column visibility toggle
- [ ] `/registry/personnel` · inline edit fullName on header
- [ ] `/registry/personnel` · view overview tab on detail
- [ ] `/registry/personnel` · view documents tab and upload
- [ ] `/registry/personnel` · view linked-accounts tab
- [ ] `/registry/personnel` · view history tab
- [ ] `/registry/personnel` · link personnel to asset
- [ ] `/registry/personnel` · link personnel to control
- [ ] `/registry/personnel/[id]` · Tab switching URL persistence (Overview/Documents/Linked-Accounts/Assessments/History) — _URL-controlled tabs implemented but no test of the route_
- [ ] `/registry/platforms` · view single platform detail when only one platform exists — _detail page auto-renders instead of card grid when platformsNodes.length === 1; no test covers this routing logic_
- [ ] `/registry/platforms` · view platform ownership sidebar — _sidebar displays platform/business/technical/internal/security owners; no test asserts sidebar rendering_
- [ ] `/registry/platforms` · view assets tab with in-scope and out-of-scope assets — _detail page tabs show asset counts; no test covers tab content or asset filtering_
- [ ] `/registry/platforms` · view vendors tab with in-scope and out-of-scope vendors — _detail page tabs show vendor counts; no test covers tab content or vendor filtering_
- [ ] `/registry/platforms` · upload platform diagrams — _file upload dialog with diagram type selector (Architecture/Data-flow/Trust-boundary); no test covers upload UI or persist_
- [ ] `/registry/platforms/[id]` · delete-platform — _No test for delete confirmation dialog and deletion flow_
- [ ] `/registry/platforms/[id]` · view-ownership-sidebar — _No test for rendering ownership information (Platform Owner, Business/Technical/Internal/Security Owners)_
- [ ] `/registry/platforms/[id]` · view-diagrams-section — _No test for rendering diagrams (architecture, data flow, trust boundary)_
- [ ] `/registry/platforms/[id]` · upload-diagram — _No test for diagram file upload_
- [ ] `/registry/platforms/[id]` · delete-diagram — _No test for diagram deletion_
- [ ] `/registry/system-details` · inline edit system name and persist
- [ ] `/registry/system-details` · inline edit tags and persist
- [ ] `/registry/system-details` · inline edit sensitivity level and persist
- [ ] `/registry/system-details` · inline edit last reviewed date and persist
- [ ] `/registry/system-details` · bulk select rows
- [ ] `/registry/system-details` · bulk edit sensitivity level on selected items
- [ ] `/registry/system-details` · export visible columns to CSV
- [ ] `/registry/system-details` · column visibility toggle via menu
- [ ] `/registry/system-details` · sort by system name ascending/descending
- [ ] `/registry/vendors` · permission-based field visibility and edit gating
- [ ] `/registry/vendors/[id]` · upload logo — _VendorLogoDialog exists in code but no e2e test exercises the flow_
- [ ] `/registry/vendors/[id]` · inline edit name/displayName — _HoverPencilWrapper and inline editing implemented but not tested_
- [ ] `/registry/vendors/[id]` · domains section (add/remove) — _DomainsSection tab exists but no test coverage_
- [ ] `/registry/vendors/[id]` · risk review frequency edit — _DropdownMenu for frequency exists but no test_
- [ ] `/registry/vendors/[id]` · risk score/tier fields — _Fields exist in RiskReviewTab but no test_
- [ ] `/registry/vendors/[id]` · create review — _CreateReviewSheet referenced but no test_
- [ ] `/registry/vendors/[id]` · merge records — _MergeMenuItem implemented but not tested_
- [ ] `/registry/vendors/[id]` · contact search and bulk actions — _Search, bulk edit, bulk delete dialogs exist but not tested_

### signup

- [ ] `/signup` · Email domain validation / allowed domains redirect to /waitlist — _Requires allowedLoginDomains config and /waitlist page interaction_
- [ ] `/signup` · reCAPTCHA verification success/failure — _reCAPTCHA external service — partially covered by shim but no real validation test_

### standards

- [ ] `/standards` · Filter by systemOwned/updatedAt/createdAt/version/revision/governingBody — _TableFilter UI present with 6 filter fields but no e2e test covers opening/applying filters_
- [ ] `/standards/[id]` · verify column visibility toggle (select checkbox column hidden for non-editors)
- [ ] `/standards/[id]` · select and deselect individual controls with checkbox
- [ ] `/standards/[id]` · select all controls in a category with header checkbox
- [ ] `/standards/[id]` · add dialog form - select program and submit to clone controls to organization
- [ ] `/standards/[id]` · permission gating - Add Controls button only visible to editors

### trust-center

- [ ] `/trust-center/customer-logos` · readonly member cannot create/edit/delete — _requires permission gating testing with different user roles_
- [ ] `/trust-center/documents` · Toggle column visibility
- [ ] `/trust-center/documents` · Bulk delete multiple selected documents
- [ ] `/trust-center/documents` · Bulk edit category and visibility of multiple documents
- [ ] `/trust-center/documents` · Preview document PDF in dialog
- [ ] `/trust-center/documents` · Toggle watermark enabled/disabled on individual document
- [ ] `/trust-center/documents` · Configure global watermark settings (text or file-based) — _Requires watermark/file-processing backend; complex multi-step form_
- [ ] `/trust-center/documents` · View NDA warning when protected document has no NDA template
- [ ] `/trust-center/updates` · Character counter feedback — _No TrustCenter seeder — coverage deferred pending trust-center setup._
- [ ] `/trust-center/updates` · Permission-based edit/delete gating (ReadOnly cannot edit/delete) — _No TrustCenter seeder — coverage deferred pending trust-center setup._
- [ ] `/trust-center/updates` · Post list with metadata — _No TrustCenter seeder — coverage deferred pending trust-center setup._

### user-management

- [ ] `/user-management/groups` · list groups in card view — _infinite scroll card view exists in code_
- [ ] `/user-management/groups` · search groups — _debounced search input with text matching on name/displayName_
- [ ] `/user-management/groups` · filter groups by member — _TableFilter component with member dropdown and isManaged boolean_
- [ ] `/user-management/groups` · quick filters — _All Groups, My Groups, System Managed Groups quick filter buttons_
- [ ] `/user-management/groups` · change member role — _inline role select dropdown in members table_
- [ ] `/user-management/groups` · remove member from group — _trash icon button in members table_
- [ ] `/user-management/members` · Members List: sort members — _MEMBERS_SORT_FIELDS defined but no e2e test exercises sort interaction_
- [ ] `/user-management/members` · Members List: filter by auth provider — _MEMBERS_FILTER_FIELDS defined with authProviderIn multiselect but no e2e test_
- [ ] `/user-management/members` · Members List: filter by role — _MEMBERS_FILTER_FIELDS defined with roleIn multiselect but no e2e test on members table_
- [ ] `/user-management/members` · Invites Tab: filter by created date — _INVITES_FILTER_FIELDS defines dateRange but no e2e test_
- [ ] `/user-management/members` · Invites Tab: sort invites — _INVITES_SORT_FIELDS defined but no e2e test exercises sort interaction_

### user-settings

- [ ] `/user-settings` · select default organization — _dropdown selection and save - not covered_
- [ ] `/user-settings` · regenerate TFA recovery codes — _regenerate and download/copy codes - not covered_
- [ ] `/user-settings` · view passkeys list — _list rendering with device names - not covered_
- [ ] `/user-settings` · remove passkey — _delete dialog confirmation - not covered_
- [ ] `/user-settings` · edit profile name (first, last, display, email) — _validation and save mutation - asserted as render-only, not mutation-tested_
- [ ] `/user-settings/profile` · select and save default organization from dropdown — _form with dropdown selection and save_
- [ ] `/user-settings/profile` · view and copy TFA secret key (manual setup) — _fallback when QR scan unavailable_
- [ ] `/user-settings/profile` · enable/disable two-factor authentication toggle — _persist TFA enabled state_
- [ ] `/user-settings/profile` · remove two-factor authentication — _destructive action_
- [ ] `/user-settings/profile` · regenerate TFA recovery codes and download/copy — _recovery code display, copy, download flows_
- [ ] `/user-settings/profile` · add passkey device via WebAuthn registration — _browser WebAuthn API required - may need simulator/mock_
- [ ] `/user-settings/profile` · remove passkey device with confirmation dialog — _confirmation required before deletion_

### verify

- [ ] `/verify` · display loading state — _loading state visible but never directly asserted in test_
- [ ] `/verify` · display error on verification failure — _error state exists in code but is never rendered in UI; unclear if intentional or unfinished_

## 🟢 Low priority (157)

### automation

- [ ] `/automation/campaigns` · detail page: view campaign runs table
- [ ] `/automation/campaigns` · detail page: view and click recipients table to open detail panel
- [ ] `/automation/campaigns/[id]` · view campaign tags display
- [ ] `/automation/questionnaires/questionnaire-editor` · breadcrumb navigation — _No test for breadcrumb context setup and navigation links_
- [ ] `/automation/questionnaires/questionnaire-viewer` · Send questionnaire with partial failures (some emails fail) — _Error notification and retry state untested; requires mock API failures_
- [ ] `/automation/questionnaires/templates/template-editor` · breadcrumb trail setup — _BreadcrumbContext.setCrumbs called but not verified in tests_
- [ ] `/automation/tasks` · Task conversation/comments thread — _Conversation component present but not tested_
- [ ] `/automation/workflows/definitions/[id]` · Navigate back to definitions list
- [ ] `/automation/workflows/editor` · visual-editor-undo-redo — _undo/redo buttons in visual editor not tested_
- [ ] `/automation/workflows/inbox` · empty state for each section — _No test verifies empty-state messaging when no pending assignments in section_
- [ ] `/automation/workflows/instances` · empty state rendering
- [ ] `/automation/workflows/instances` · formatted date/time display in Updated column
- [ ] `/automation/workflows/instances` · info card display when instances exist
- [ ] `/automation/workflows/templates` · verify template categories and badges render correctly — _category badge styling not tested_
- [ ] `/automation/workflows/wizard` · Review step: view workflow definition JSON preview

### controls

- [ ] `/controls` · view-status-donut-per-category — _Visual component; no e2e test needed_
- [ ] `/controls` · sort-controls-in-table — _Sort works via DataTable but no e2e test for sort interaction itself_
- [ ] `/controls` · paginate-controls-in-table — _Pagination works via DataTable but no e2e test for pagination interaction_
- [ ] `/controls/[id]` · update tags field — _tags field is in properties card with creatable multi-select but no e2e coverage_
- [ ] `/controls/[id]` · update status via properties card double-click inline — _status field has double-click edit in properties card; only simple cases tested_
- [ ] `/controls/[id]` · update category/subcategory fields — _category and subcategory fields exist but no e2e test coverage_
- [ ] `/controls/[id]` · update mapped categories field — _mapped categories field visible but no e2e test coverage_
- [ ] `/controls/[id]` · update authority/reference IDs — _referenceID, auditorReferenceID fields exist but untested_
- [ ] `/controls/[id]` · ask AI (open/close dialog, send prompt) — _Ask AI button exists and opens AIChat component but no e2e coverage; likely blocked by AI service dependency_
- [ ] `/controls/[id]` · clone control via actions menu — _Clone Control action in menu but no e2e test verifies the flow completes_
- [ ] `/controls/[id]` · quick actions: create subcontrol (button -> create-subcontrol route) — _route navigation only; form submission tested elsewhere_
- [ ] `/controls/[id]` · quick actions: map control (button -> map-control route) — _route navigation only; map form tested elsewhere_
- [ ] `/controls/[id]` · view Verified badge when control has verification — _badge renders conditionally but no e2e coverage_
- [ ] `/controls/[id]` · handle framework source restrictions (message + links) — _info message with links appears when source is FRAMEWORK but no e2e test verifies message or click-through_
- [ ] `/controls/[id]` · navigation guard prompts on unsaved form changes — _useNavigationGuard enabled when isDirty but no e2e coverage of leaving page with unsaved changes_
- [ ] `/controls/[id]` · view discussion/comments on description (nested in description field) — _discussionData passed to DescriptionField but comment thread interaction untested_
- [ ] `/controls/[id]` · manage tags via sidebar HoverPencilWrapper — _tags field in properties card has click-to-edit but no e2e coverage_
- [ ] `/controls/[id]` · view/download/view details of linked evidence/task/asset/scan/finding/review via sheets — _detail sheets (EvidenceDetailsSheet, TaskDetailsSheet, etc.) rendered conditionally via query params but no e2e navigation tested_
- [ ] `/controls/[id]/[subcontrolId]` · ask AI dialog
- [ ] `/controls/[id]/[subcontrolId]` · ask AI with subcontrol context
- [ ] `/controls/[id]/[subcontrolId]/control-implementation` · empty state with create prompt — _No e2e test exercises the empty state page when no implementations exist_
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · expand/collapse individual objectives
- [ ] `/controls/[id]/[subcontrolId]/control-objectives` · toggle expand all objectives
- [ ] `/controls/[id]/[subcontrolId]/map-control` · expand all / collapse all matched controls
- [ ] `/controls/[id]/clone-control` · create-multiple — _Create multiple toggle switch to batch-create clones; no test covers this affordance_
- [ ] `/controls/[id]/clone-control` · cancel-operation — _Cancel button redirects to /controls list; no test covers cancellation flow during clone_
- [ ] `/controls/[id]/create-subcontrol` · Properties card fields — update status, owner, delegate, tags, categories during creation — _Properties card is rendered but no test covers interaction during form submission_
- [ ] `/controls/[id]/create-subcontrol` · Permission gate — non-authorized user sees ProtectedArea instead of form — _Permission check in code but not explicitly tested; covered implicitly by auth setup_
- [ ] `/controls/[id]/create-subcontrol` · Cancel button workflow — _Button is present but cancel behavior not tested_
- [ ] `/controls/[id]/create-subcontrol` · mapControlId and mapSubcontrolId query params — auto-populate related controls on load — _Query parameter handling exists but not tested in e2e_
- [ ] `/controls/[id]/edit-map-control` · toggle accordion cards (From/To)
- [ ] `/controls/[id]/map-control` · relation description textarea — _basic text input_
- [ ] `/controls/[id]/map-control` · cancel/navigate back — _basic navigation_
- [ ] `/controls/[id]/map-control` · expand/collapse all matched controls — _UX convenience_
- [ ] `/controls/create-subcontrol` · create multiple subcontrols with field resets

### dashboard

- [ ] `/dashboard` · view documentation external link
- [ ] `/dashboard` · contact support external link

### developers

- [ ] `/developers/personal-access-tokens` · view authorized organizations in edit form
- [ ] `/developers/personal-access-tokens` · error handling for token operations (network, server errors)
- [ ] `/developers/personal-access-tokens` · last used timestamp display

### evidence

- [ ] `/evidence` · View associated objects
- [ ] `/evidence` · View workflow state
- [ ] `/evidence` · Select multiple rows via checkbox
- [ ] `/evidence` · Sort by column headers
- [ ] `/evidence` · Paginate through evidence list
- [ ] `/evidence` · Manage evidence tags

### exposure

- [ ] `/exposure/remediations` · export remediations to CSV — _file download — end-to-end verification needed_
- [ ] `/exposure/remediations` · create new Environment enum value — _creatable enum — depends on createRemediation seeder_
- [ ] `/exposure/remediations` · create new Scope enum value — _creatable enum — depends on createRemediation seeder_
- [ ] `/exposure/reviews` · bulk create from CSV
- [ ] `/exposure/reviews` · export reviews to CSV
- [ ] `/exposure/reviews` · upload/manage review documents — _requires file upload capability; no test seeder for documents_
- [ ] `/exposure/risks` · filter by score range
- [ ] `/exposure/risks` · filter by program
- [ ] `/exposure/risks` · filter by tags
- [ ] `/exposure/risks/[id]` · activity tab (tasks) — _ActivityTab with ActivityTasksSection, accordion-based_
- [ ] `/exposure/risks/[id]` · dirty form navigation guard — _useNavigationGuard + CancelDialog for unsaved changes_
- [ ] `/exposure/risks/create` · submit with create-multiple toggle — _Toggle switch and form reset on success not explicitly tested_

### forgot-password

- [ ] `/forgot-password` · email validation or empty field submission behavior — _HTML5 required attribute present but client-side validation UX not tested_

### invite

- [ ] `/invite` · email parameter passing through redirects
- [ ] `/invite` · direct OAuth cookie setting on successful acceptance

### login

- [ ] `/login` · Terms of Service and Privacy Policy links are functional — _External links - typically not tested in e2e_
- [ ] `/login` · Webfinger debounce clears stale responses correctly — _No test asserting debounce timing or cleanup_
- [ ] `/login` · Email input change resets SSO toggle to false — _Internal state management, no user-facing assertion_
- [ ] `/login` · Sign up link prefills token in query string — _Navigates to /signup - no assertion of parameter passing_
- [ ] `/login` · Password visibility toggle on password input — _Password input toggle exists on /login but only tested on /signup_

### onboarding

- [ ] `/onboarding` · Error handling on submission failure — _GraphQL error scenarios, network failures, or validation errors during submission not tested_
- [ ] `/onboarding` · Step 3 data persistence across navigation — _Step 2 persistence tested, but Step 3 toggle states not verified after back/forward navigation_
- [ ] `/onboarding` · Conditional validation when sector is 'Other' — _Conditional field appears but its validation (required when sector is Other) not tested_

### organization

- [ ] `/organization` · create organization conditional heading — _Verify heading text differs based on numOrgs (first vs another org)_
- [ ] `/organization` · error handling on organization creation — _Test GraphQL error scenarios and error notification display_
- [ ] `/organization` · error handling on leave organization — _Test mutation error scenarios and error notification display_

### organization-settings

- [ ] `/organization-settings/integrations` · open-manage-installation-external-link — _External link opens in new window - difficult to test without provider integration_
- [ ] `/organization-settings/integrations/[definitionId]` · back button/breadcrumb navigation returns to /organization-settings/integrations
- [ ] `/organization-settings/subscribers` · copy email to clipboard

### password-reset

- [ ] `/password-reset` · Password visibility toggle (show/hide) — _Generic PasswordInput component behavior; covered by password-input toggle test on /signup_
- [ ] `/password-reset` · Submit button disabled state during submission — _UX verification only_

### policies

- [ ] `/policies` · awaiting-approval-table — _Dashboard table visibility when policies need approval - no test_
- [ ] `/policies` · review-due-soon-table — _Dashboard table for review-due-soon policies - no test_
- [ ] `/policies` · policies-without-procedures-table — _Dashboard table for policies without linked procedures - no test_
- [ ] `/policies` · row-links-to-detail — _Table rows should link to /policies/{id}/view - likely works but no dedicated e2e test_
- [ ] `/policies` · sort — _Table column sorting - UI exists but behavior not tested_
- [ ] `/policies/[id]/view` · create items from policy toolbar (create new policy, create new procedure, create task) — _Toolbar buttons exist but not tested on view page; create-new-policy/procedure navigate to create forms, create-task opens dialog_
- [ ] `/policies/[id]/view` · discussions/comments on policy details — _Plate editor supports comments; not tested via e2e (complex editor internals)_
- [ ] `/policies/create` · draft restore modal - resume/discard flows — _localStorage-backed draft, uses custom hook_
- [ ] `/policies/create` · form submission error handling - display error messages

### procedures

- [ ] `/procedures` · inline edit approver cell — _ApproverCell is editable inline but not tested on list page_
- [ ] `/procedures` · inline edit delegate cell — _DelegateCell is editable inline but not tested on list page_
- [ ] `/procedures/[id]/view` · inline-version-edit — _Revision field inline edit not covered_
- [ ] `/procedures/[id]/view` · inline-procedure-type-edit — _Procedure Type creatable enum inline edit not covered_
- [ ] `/procedures/[id]/view` · inline-review-date-edit — _Review date calendar picker inline edit not covered_
- [ ] `/procedures/[id]/view` · view-historical-metadata — _Historical card (Created By/At, Updated By/At) not explicitly tested_
- [ ] `/procedures/create` · draft-restore — _DraftRestoreModal component exists; no e2e coverage_
- [ ] `/procedures/create` · edit-title — _edit mode only (tested in view page); create-redirect-to-view makes create title changes untestable_
- [ ] `/procedures/create` · edit-status — _edit mode only (tested in view page)_
- [ ] `/procedures/create` · edit-metadata-in-edit-mode — _edit mode accessed from view page; create flow redirects to view_
- [ ] `/procedures/create` · approval-required-indicator — _edit mode shows alert; create mode shows doc link alert instead_

### programs

- [ ] `/programs/[id]` · click View Tasks button to navigate to /automation/tasks with program filter — _saves filter to table state_
- [ ] `/programs/[id]` · click Go to controls button to navigate to /controls with program filter — _saves filter to table state_
- [ ] `/programs/[id]` · click Create Program button to navigate to /programs/create — _permission-gated by CanCreateProgram role_
- [ ] `/programs/create` · View Breadcrumb Navigation — _Breadcrumb set via BreadcrumbContext but not directly tested on /programs/create page_
- [ ] `/programs/create` · View Page Heading — _Create New Program heading not tested_
- [ ] `/programs/create` · Card Details and Descriptions — _Card descriptions, detail text, and Template badges not explicitly tested_
- [ ] `/programs/create/advanced-setup` · Summary sidebar: real-time updates as form changes
- [ ] `/programs/create/framework-based` · render breadcrumb with 5 items
- [ ] `/programs/create/generic-program` · fill-description — _Description field is optional and not tested; no validation, no persistence assertion_

### questionnaire

- [ ] `/questionnaire` · Loading state — _UI state validation; low user impact_
- [ ] `/questionnaire` · Theme switching (dark/light mode) — _CSS theme application; low priority for form functionality_

### registry

- [ ] `/registry/contacts` · column-visibility-menu — _No test for toggling column visibility_
- [ ] `/registry/contacts` · inline-edit-fullname — _No test for inline editing fullName_
- [ ] `/registry/contacts` · inline-edit-tags — _No test for inline editing tags_
- [ ] `/registry/contacts` · merge-records — _Merge feature present but requires detailed interaction testing_
- [ ] `/registry/platforms` · download platform diagram — _download button on each diagram; no test covers download functionality_
- [ ] `/registry/platforms` · mark/unmark diagram as evidence — _detail view has mark/unmark dialogs for diagrams; no test covers this flow_
- [ ] `/registry/platforms` · no platforms empty state — _callout renders when platform list is empty; no test covers empty state UI_
- [ ] `/registry/platforms/[id]` · view-graph-visualization — _No test for network graph rendering_
- [ ] `/registry/platforms/[id]` · mark-diagram-as-evidence — _No test for marking diagrams as evidence_
- [ ] `/registry/platforms/[id]` · unmark-diagram-evidence — _No test for unmarking diagrams as evidence_
- [ ] `/registry/platforms/[id]` · view-asset-details — _No test for clicking on assets to view details_
- [ ] `/registry/platforms/[id]` · view-vendor-details — _No test for clicking on vendors to view details_
- [ ] `/registry/system-details` · sort by other columns and verify order
- [ ] `/registry/system-details` · pagination prev/next and page navigation
- [ ] `/registry/vendors/[id]` · dependencies view — _DependenciesSection exists but not tested_
- [ ] `/registry/vendors/[id]` · directory groups view — _DirectoryTab conditional on hasDirectoryGroups; no test_
- [ ] `/registry/vendors/[id]` · activity comments — _ActivityCommentsSection exists but not tested_
- [ ] `/registry/vendors/[id]` · contact table/card view toggle — _VIEW_MODE_STORAGE_KEY localStorage toggle in ContactsTab but not tested_

### resend-verify

- [ ] `/resend-verify` · Empty email submission feedback — _No test for submitting empty form field_

### signup

- [ ] `/signup` · Terms of Service and Privacy Policy links — _External links to OPENLANE_WEBSITE_URL_

### standards

- [ ] `/standards/[id]` · breadcrumb navigation renders with standard name
- [ ] `/standards/[id]` · loading state displays skeleton during data fetch
- [ ] `/standards/[id]` · error state handles missing standard or failed data load

### trust-center

- [ ] `/trust-center/documents` · Copy document detail link to clipboard
- [ ] `/trust-center/documents` · View empty state panel with guidance when no documents exist
- [ ] `/trust-center/updates` · Empty state display — _No TrustCenter seeder — coverage deferred pending trust-center setup._

### user-management

- [ ] `/user-management/groups` · sort table columns — _table has onSortChange handler with GROUP_SORT_FIELDS_
- [ ] `/user-management/groups` · column visibility toggle — _ColumnVisibilityMenu component with default visibility state_
- [ ] `/user-management/groups` · copy group link — _copy link button in details sheet header_
- [ ] `/user-management/groups` · inherit permissions — _InheritPermissionDialog component exists_
- [ ] `/user-management/members` · Invites Tab: copy invite email to clipboard — _copy icon present in InvitesColumns but not tested_
- [ ] `/user-management/members` · Invite Sheet: search groups — _search input present in MembersInviteSheet but not tested_

### user-settings

- [ ] `/user-settings/profile` · view registered passkeys list and device details — _read-only assertion of existing passkeys_
- [ ] `/user-settings/profile` · profile form validation errors (field length, email format) — _client-side validation UX_

## ⛔ Blocked / out of scope

> Excluded from the actionable backlog — need infra we don't have or are explicitly out of scope (OAuth/SSO, Stripe, Novu, email/invite tokens, SurveyJS editor internals, scanner-seeded data, dnd-kit, or no API seeder).

### automation

- `/automation/campaigns` · export campaigns — _unimplemented per code comment_
- `/automation/campaigns/[id]` · breadcrumb navigation — _no seeder: campaigns created only via UI wizard; campaign detail requires pre-existing campaign ID_
- `/automation/questionnaires` · object creation template badge and filtering — _SurveyJS editor internals out-of-scope_
- `/automation/questionnaires/questionnaire-viewer` · Send questionnaire dialog: add recipient emails and send — _No e2e tests for email input, suggestions, or send submission; requires seeded assessment + contact/personnel data_
- `/automation/questionnaires/questionnaire-viewer` · Send questionnaire: contact suggestion search and selection — _Email suggestion dropdown requires contacts/identity-holders data; no seeder coverage_
- `/automation/questionnaires/questionnaire-viewer` · System-owned questionnaire (Edit/Delete/Save as Template hidden) — _systemOwned=true state untested; no seeder provides system-owned assessments_
- `/automation/questionnaires/templates/template-editor` · theme toggle (light/dark) — _theme switching is internal to SurveyJS creator surface; out-of-scope_
- `/automation/questionnaires/templates/template-editor` · save template (create new) — _creator.saveSurveyFunc calls saveTemplate with new template; requires SurveyJS save interaction which is internal to third-party library_
- `/automation/questionnaires/templates/template-editor` · save template (update existing) — _updateTemplateData mutation; requires SurveyJS save interaction and templateId param_
- `/automation/questionnaires/templates/template-viewer` · survey rendering in display mode — _SurveyJS Survey renders in display mode but not tested; SurveyJS editor internals out-of-scope_
- `/automation/tasks` · Object associations: link/unlink to Controls, Subcontrols, Programs, Procedures, Policies, Control Objectives, Risks, Scans, Tasks, Identity Holders — _Only available when editing; full association flows not tested_
- `/automation/tasks` · Create evidence from detail sheet — _Evidence button available but flow not tested; out-of-scope without seeded controls_
- `/automation/workflows/templates` · verify template summary metadata displays correctly (Goal, Object, Trigger, Targets) — _metadata rendering not tested; no seeder/API dependency assumed_

### controls

- `/controls/[id]` · view object associations sidebar (graph view default, toggle to list) — _ObjectAssociationSwitch rendered but minimal coverage (unlink policy only)_
- `/controls/[id]/[subcontrolId]` · view subcontrol details — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · edit mode toggle — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · save changes via form submission — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · cancel editing — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · delete subcontrol via actions menu — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · inline title/refCode edit (double-click) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · inline status edit (double-click) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · add/remove object associations (sidebar) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · view tabs (implementation, evidence, linked-controls, guidance, documentation, assets-scans, findings-risks, reviews, activity) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · tab navigation via query param — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · quick actions (add implementation, add objective, upload evidence, create task, map control) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · update properties (owner, delegate, responsible party, tags) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · navigation guard (unsaved changes warning) — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]` · view verification status badge — _no seeder for createSubcontrol API function_
- `/controls/[id]/[subcontrolId]/control-implementation` · link controls/subcontrols — _No e2e test exercises the LinkControlsModal for associating controls/subcontrols_
- `/controls/[id]/[subcontrolId]/edit-map-control` · drag and drop control selection — _dnd-kit operations, item addition/removal_
- `/controls/[id]/[subcontrolId]/map-control` · drag-and-drop controls into From/To zones — _dnd-kit/HTML5 drag—verify test harness supports_
- `/controls/[id]/clone-control` · associate-objects — _ControlAssociationSection for associating related objects; no test covers association during clone_
- `/controls/[id]/control-implementation` · list implementations — _no seeder_
- `/controls/[id]/control-implementation` · create implementation — _no seeder_
- `/controls/[id]/control-implementation` · edit implementation — _no seeder_
- `/controls/[id]/control-implementation` · delete implementation — _no seeder_
- `/controls/[id]/control-implementation` · unlink implementation — _no seeder_
- `/controls/[id]/control-implementation` · mark verified toggle — _no seeder_
- `/controls/[id]/control-implementation` · link controls modal — _no seeder_
- `/controls/[id]/control-implementation` · empty state display — _no seeder_
- `/controls/[id]/control-implementation` · permission-gated create button — _no seeder_
- `/controls/[id]/create-subcontrol` · Subcontrol Association Section — link policies, procedures, tasks, programs, risks, assets, scans, entities, etc. — _Association panel renders but no test covers adding/removing associations during creation_
- `/controls/[id]/edit-map-control` · drag controls to From/To drop zones — _dnd-kit drag-and-drop internals_
- `/controls/[id]/map-control` · drag-and-drop controls to drop zones — _dnd-kit not supported in scope_

### developers

- `/developers/api-tokens` · authorize token for SSO (if org has identity provider enforced) — _out-of-scope OAuth/SSO_
- `/developers/personal-access-tokens` · authorize token for SSO (post-create and from edit) — _SSO-scoped feature, out-of-scope: OAuth/SSO integration_

### exposure

- `/exposure/findings` · filter panel opens and fields render — _scanner-seeded data, no seeder_
- `/exposure/findings` · search filters findings — _scanner-seeded data, no seeder_
- `/exposure/findings` · column visibility menu toggle — _scanner-seeded data, no seeder_
- `/exposure/findings` · severity chart click filters findings — _scanner-seeded data, no seeder_
- `/exposure/findings` · row selection and checkbox interaction — _scanner-seeded data, no seeder_
- `/exposure/findings` · bulk delete findings — _scanner-seeded data, no seeder_
- `/exposure/findings` · bulk edit findings — _scanner-seeded data, no seeder_
- `/exposure/findings` · bulk CSV create from file — _scanner-seeded data, no seeder_
- `/exposure/findings` · detail sheet opens and data loads — _scanner-seeded data, no seeder_
- `/exposure/findings` · edit finding fields and save — _scanner-seeded data, no seeder_
- `/exposure/findings` · create new finding — _scanner-seeded data, no seeder_
- `/exposure/findings` · row action: track remediation — _scanner-seeded data, no seeder_
- `/exposure/findings` · row action: open remediation — _scanner-seeded data, no seeder_
- `/exposure/findings` · row action: create task — _scanner-seeded data, no seeder_
- `/exposure/findings` · manage finding associations — _scanner-seeded data, no seeder_
- `/exposure/findings` · sort by column — _scanner-seeded data, no seeder_
- `/exposure/findings` · pagination — _scanner-seeded data, no seeder_
- `/exposure/findings` · export findings — _scanner-seeded data, no seeder_
- `/exposure/overview` · SLA save and cancel buttons — _scanner-seeded data (vulnerabilities/findings/risks) required for comprehensive coverage_
- `/exposure/remediations` · search remediations by name/summary — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · create remediation via form — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · edit remediation fields in detail view — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · delete remediation — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · bulk delete remediations — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · bulk edit remediations — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · link/unlink remediation to controls — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · link/unlink remediation to subcontrols — _no seeder — createRemediation API helper not implemented_
- `/exposure/remediations` · link/unlink remediation to findings — _scanner-seeded data — out-of-scope_
- `/exposure/remediations` · link/unlink remediation to vulnerabilities — _scanner-seeded data — out-of-scope_
- `/exposure/risks/[id]` · object association (link/unlink controls/procedures/programs/policies/tasks/assets/entities/scans/remediations/reviews/action-plans) — _ObjectAssociationSwitch + useAssociationRemoval; 12 association types per RISK_ASSOCIATION_SECTIONS config_
- `/exposure/risks/create` · associate objects (controls/subcontrols/programs/tasks/policies/procedures/assets/entities/scans/action-plans) — _AssociationSection requires seeded data; associations use graphql hooks_
- `/exposure/scans` · create scan happy path — _no seeder - scanner-fed data, no createScan in API utils_
- `/exposure/scans` · search filters scans by target — _no seeder_
- `/exposure/scans` · filter panel exposes Status/ScanType/Environment/Scope fields — _no seeder_
- `/exposure/scans` · column visibility menu lists toggleable columns — _no seeder_
- `/exposure/scans` · edit scan detail sheet — _no seeder_
- `/exposure/scans` · bulk delete scans — _no seeder_
- `/exposure/scans` · bulk edit multiple scans — _no seeder_
- `/exposure/scans` · view associated objects on scan detail — _no seeder_
- `/exposure/scans` · bulk csv create scans — _no seeder - file upload dependency_
- `/exposure/scans/domain-scan` · vendors step - review and select — _no-seeder: requires domain scan notification with vendor payload in notifications context_
- `/exposure/scans/domain-scan` · assets step - review owned and external domains — _no-seeder: requires domain scan notification with DNS records in notifications context_
- `/exposure/scans/domain-scan` · findings step - review security findings — _no-seeder: requires domain scan notification with findings payload in notifications context_
- `/exposure/scans/domain-scan` · confirm step - review summary — _no-seeder: requires full multi-step wizard traversal with notification data_
- `/exposure/scans/domain-scan` · wizard navigation - continue button — _no-seeder: requires notification data to render steps_
- `/exposure/scans/domain-scan` · wizard navigation - back button — _no-seeder: requires notification data_
- `/exposure/scans/domain-scan` · bulk import action — _no-seeder: requires notification data; tests bulk creation of vendors, assets, findings via GraphQL mutations_
- `/exposure/scans/domain-scan` · select item via checkbox — _no-seeder: requires vendor/asset/finding data in notification payload_
- `/exposure/scans/domain-scan` · deselect item via checkbox — _no-seeder: requires notification data_
- `/exposure/scans/domain-scan` · disable item interaction - already added — _no-seeder: requires pre-existing vendors/assets in system to test disabled state_
- `/exposure/scans/domain-scan` · import success flow — _no-seeder: requires notification data and success response from bulk create mutations_
- `/exposure/scans/domain-scan` · import error handling — _no-seeder: requires notification data and error simulation_
- `/exposure/scans/domain-scan` · loading state during import — _no-seeder: requires notification data and mutation simulation_
- `/exposure/scans/domain-scan` · empty state - no vendors detected — _no-seeder: requires notification without vendor payload_
- `/exposure/scans/domain-scan` · empty state - no assets detected — _no-seeder: requires notification without DNS records_
- `/exposure/scans/domain-scan` · empty state - no findings detected — _no-seeder: requires notification without findings payload_
- `/exposure/vulnerabilities` · search by display name, description, CVE ID, external ID — _no seeder — vulnerabilities are scanner-fed data only, cannot create via API to test search_
- `/exposure/vulnerabilities` · filter by security level, status, priority, source, category, open/closed, production, blocking, validated, environment, scope, tags — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · filter by severity chart (critical/high/medium/low) — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · sort table by any column — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · toggle column visibility — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · export to CSV — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · select and bulk delete — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · select and bulk edit — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · bulk CSV upload — _file upload, scanner-seeded data only_
- `/exposure/vulnerabilities` · view vulnerability detail sheet — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · inline edit in detail sheet — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · delete via detail sheet — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · link/unlink object associations (controls, subcontrols, findings, remediations, reviews, assets, tasks) — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · track remediation for vulnerability — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · open existing remediation — _no seeder — vulnerabilities are scanner-fed data only_
- `/exposure/vulnerabilities` · create task for vulnerability — _no seeder — vulnerabilities are scanner-fed data only_

### invite

- `/invite` · authenticated invite acceptance requires valid token from backend — _no seeder for creating valid invite tokens_

### login

- `/login` · Google OAuth button click initiates sign-in — _OAuth/SSO - out of scope (no mocking of OAuth provider response)_
- `/login` · GitHub OAuth button click initiates sign-in — _OAuth/SSO - out of scope_
- `/login` · Passkey sign-in flow (startAuthentication → verifyAuthentication) — _WebAuthn - out of scope (browser security API, no test harness support)_
- `/login` · SSO (OIDC) button shown and triggers /api/auth/sso when org has provider configured — _SSO/OIDC - out of scope (requires org-level SSO configuration seeding)_
- `/login` · Toggle 'Login with password' visible only for org admin with enforced SSO — _Requires webfinger response with is_org_owner=true and enforced=true - org SSO seeding required_
- `/login` · Last used provider badge displays on buttons and input — _Device-local storage (localStorage) - no seeder or per-test-reset mechanism_
- `/login` · Email parameter prefilling from ?email= query string — _Email prefill flow exists but no test coverage_
- `/login` · reCAPTCHA token exchange before credentials submit — _reCAPTCHA - out of scope (uses real or shimmed API, already handled by utils but not directly tested on login)_
- `/login/sso` · SSO OAuth callback with code+state validation — _SSO with a real IdP out-of-scope per plan.md — requires Dex container orchestration_
- `/login/sso` · Successful callback with NextAuth signin and redirect — _OAuth/SSO out-of-scope — dev backend may not have provider configured_
- `/login/sso` · Missing OAuth parameters error handling — _OAuth/SSO out-of-scope_
- `/login/sso` · Missing organization*id cookie error handling — \_OAuth/SSO out-of-scope*
- `/login/sso` · Callback API failure handling — _OAuth/SSO out-of-scope_
- `/login/sso` · Test mode redirect to organization-settings — _OAuth/SSO out-of-scope — requires SSO-enforced org seed_
- `/login/sso` · Token mode redirect to API tokens page — _OAuth/SSO out-of-scope_
- `/login/sso` · Default redirect to dashboard — _OAuth/SSO out-of-scope_
- `/login/sso/enforce` · webfinger email check redirects SSO-enforced org to /login/sso/enforce — _OAuth/SSO — requires Dex OIDC container and org with SSO enforcement configured (no programmatic seeder)_
- `/login/sso/enforce` · SSO-enforced org owner can still log in with password (bypass path) — _OAuth/SSO — requires Dex OIDC container and org with SSO enforcement configured (no programmatic seeder)_
- `/login/sso/enforce` · user with direct*oauth cookie and valid params clicks Continue with SSO button and begins OAuth flow — \_OAuth/SSO — real provider redirect is out of scope; can mock API response and assert window.location.href assignment*

### notifications

- `/notifications` · filter by topic interactions — _no seeder for test notifications_
- `/notifications` · mark individual notification as read — _no seeder for test notifications_
- `/notifications` · mark all as read functionality — _no seeder for test notifications_
- `/notifications` · pagination Show More button — _no seeder for test notifications_
- `/notifications` · export download link interaction — _no seeder for test notifications_
- `/notifications` · export expired state display — _no seeder for test notifications_
- `/notifications` · click notification to navigate — _no seeder for test notifications_
- `/notifications` · date grouping and ordering — _no seeder for test notifications_
- `/notifications` · empty state messaging variations — _no seeder for test notifications_

### organization

- `/organization` · leave organization — _Click 'Leave' button on non-owner membership; requires confirmation dialog acceptance and user removal; out-of-scope: requires seeded multi-org multi-role user_
- `/organization` · role-based permission gating - leave button hidden for owners — _Verify Leave button only renders for non-owner members; out-of-scope: requires seeded owner role to compare_
- `/organization` · error handling on organization switch — _Test switch/SSO redirect error scenarios_

### organization-settings

- `/organization-settings/authentication` · test-sso-connection — _OAuth out-of-scope: test redirects to external provider_
- `/organization-settings/authentication` · view-sso-test-results-alert — _requires SSO callback from external provider_
- `/organization-settings/billing` · subscribe to module — _Stripe integration — requires payment method setup_
- `/organization-settings/billing` · unsubscribe from module — _Stripe integration_
- `/organization-settings/billing` · renew canceled module — _Stripe integration_
- `/organization-settings/billing` · subscribe to add-on — _Stripe integration_
- `/organization-settings/billing` · unsubscribe from add-on — _Stripe integration_
- `/organization-settings/billing` · switch billing interval — _Stripe integration_
- `/organization-settings/billing` · manage payment method (Stripe portal redirect) — _Stripe portal integration_
- `/organization-settings/billing` · view invoices and download PDFs — _Stripe integration_
- `/organization-settings/billing` · cancel subscription — _Stripe integration_
- `/organization-settings/billing` · renew subscription — _Stripe integration_
- `/organization-settings/integrations` · install-integration-oauth-flow — _OAuth/SSO redirect pattern - out-of-scope for standard e2e, requires external provider redirect handling_
- `/organization-settings/integrations` · request-missing-integration — _Mailto link to INFO_EMAIL - edge case, low priority_
- `/organization-settings/integrations/[definitionId]` · auth connect flow redirects to external provider and handles callback — _OAuth/external provider redirect - scope depends on seeder capability_

### password-reset

- `/password-reset` · Valid token + matching passwords → success path (notification + redirect to /login) — _Requires valid reset token from backend; email-token out-of-scope per priorities_
- `/password-reset` · API error responses (token expired on server, invalid/malformed token) — _Requires backend error responses; email-token flow out-of-scope_

### policies

- `/policies/create` · helper section - AI generation with policy name dialog and context (if AI enabled) — _out-of-scope: requires AI service enabled_
- `/policies/create` · template browser - select and upload policy from template file — _out-of-scope: file upload flow_

### procedures

- `/procedures/[id]/edit` · Link/unlink associated objects from /edit form — _Association dialog tested on view page; not tested from /edit page form_
- `/procedures/[id]/view` · object-association-toggle-list-view — _Association view toggle (assoc-view-toggle) tested but only basic visibility, not full state transitions_
- `/procedures/create` · pre-fill-policy-association — _policyId search param pre-fills associations; not tested_

### programs

- `/programs/create/framework-based` · open invite member sheet dialog — _MembersInviteSheet component requires email/invite token flow which may be out-of-scope_
- `/programs/create/risk-assessment` · Team setup step — open invite members sheet from within wizard — _out-of-scope: email/invite tokens_

### questionnaire

- `/questionnaire` · Token expired - resend link — _Requires valid expired token with assessment_id and email to test link resend flow_
- `/questionnaire` · Email mismatch - access denied — _Requires authenticated session + mismatched token email to test permission gate_
- `/questionnaire` · Survey display — _Requires seeded assessment data with valid token to fetch questionnaire config; SurveyJS internals out-of-scope_
- `/questionnaire` · Save as Draft — _Requires seeded assessment with valid token; SurveyJS user interaction requires scanner/seeder for test data_
- `/questionnaire` · Submit questionnaire — _Requires seeded assessment with valid token; SurveyJS form completion and submission requires scanner/seeder_

### registry

- `/registry/assets` · merge assets — _merge records feature requires merge-backend implementation, likely out-of-scope or depends on seeded test data_
- `/registry/personnel` · view assessments tab — _SurveyJS-based questionnaires_
- `/registry/personnel` · merge duplicate personnel records — _out-of-scope merge-records feature_
- `/registry/personnel/[id]` · View personnel details page with avatar/status badges/name — _No e2e test navigates to /registry/personnel/[id] route - no seeder for personnel creation via API_
- `/registry/personnel/[id]` · Edit personnel full form (enter edit mode, modify fields, save/cancel) — _No seeder for personnel creation via API_
- `/registry/personnel/[id]` · Delete personnel — _No seeder for personnel creation via API_
- `/registry/personnel/[id]` · Merge personnel records — _Merge functionality present in code but no seeder for personnel creation via API_
- `/registry/personnel/[id]` · Manage object associations (link/unlink assets, controls, etc) — _ObjectAssociationSwitch component present but no seeder for personnel or associated entities via API_
- `/registry/personnel/[id]` · Documents tab - upload/download/mark as evidence flow — _No seeder for personnel creation via API_
- `/registry/personnel/[id]` · Linked Accounts tab - view directory memberships — _Requires directory integration data; no seeder for personnel with linked accounts_
- `/registry/personnel/[id]` · Assessments tab - view/resend assessment responses — _No seeder for personnel or assessments via API_
- `/registry/personnel/[id]` · Permission gates - verify edit/delete actions respect owner/member/readonly roles — _No seeder for personnel creation; canEdit/canDelete checks present but untested_
- `/registry/platforms` · toggle in-scope/out-of-scope toggle — _switch visible when outOfScopeAssets or outOfScopeVendors exist; no test covers toggle interaction_
- `/registry/platforms/[id]` · copy-owner-email — _No test for email copy-to-clipboard functionality_
- `/registry/platforms/[id]` · view-assets-tab — _No test for Assets tab with in-scope/out-of-scope assets_
- `/registry/platforms/[id]` · view-vendors-tab — _No test for Vendors tab with in-scope/out-of-scope vendors_
- `/registry/platforms/[id]` · toggle-in-scope-filter — _No test for in-scope/out-of-scope visibility toggle_
- `/registry/system-details` · bulk create system details from CSV upload — _no seeder for bulk CSV workflow_
- `/registry/vendors/[id]` · security settings — _SecuritySection with hasSoc2, mfaSupported, mfaEnforced, ssoEnforced exists but not tested_
- `/registry/vendors/[id]` · object associations (link/unlink) — _ObjectAssociationSwitch and handleRemoveAssociation exist but not tested_

### resend-verify

- `/resend-verify` · Email validation error feedback — _Form uses zod email validator but no e2e test for invalid email submission_

### signup

- `/signup` · Sign up with Google OAuth — _OAuth/SSO provider integration — requires Google OAuth callback testing_
- `/signup` · Sign up with GitHub OAuth — _OAuth/SSO provider integration — requires GitHub OAuth callback testing_
- `/signup` · Sign up with invite token (?token=...) — _email-token flow — requires invitation system; no seeder_
- `/signup` · Redirect to /login when invitee already has account — _email-token flow — duplicate account scenario on invite_

### tfa

- `/tfa` · Happy path - valid authenticator app code (6 digits) → verify OTP → redirect to /dashboard — _no seeder for TFA-enabled users_
- `/tfa` · Happy path - valid recovery code (8 characters) → verify OTP → redirect to /dashboard — _no seeder for TFA-enabled users_
- `/tfa` · Invalid authenticator app code → error message displayed → stay on /tfa — _no seeder for TFA-enabled users_
- `/tfa` · Invalid recovery code → error message displayed → stay on /tfa — _no seeder for TFA-enabled users_
- `/tfa` · Toggle from authenticator to recovery code mode → input clears → OTP length updates to 8 — _no seeder for TFA-enabled users_
- `/tfa` · Toggle from recovery code back to authenticator mode → input clears → OTP length updates to 6 — _no seeder for TFA-enabled users_
- `/tfa` · API error response from /api/verifyOTP → error notification shown — _no seeder for TFA-enabled users_
- `/tfa` · Missing session data during OTP verification → error notification displayed — _no seeder for TFA-enabled users_

### trust-center

- `/trust-center/NDAs` · Upload NDA document — _no seeder - trust-center requires backend seed (TrustCenter row) which is not set up for test orgs_
- `/trust-center/NDAs` · View/Preview NDA document — _no seeder_
- `/trust-center/NDAs` · Replace NDA document — _no seeder_
- `/trust-center/NDAs` · Toggle NDA approval requirement setting — _no seeder_
- `/trust-center/NDAs` · Search NDA requests — _no seeder_
- `/trust-center/NDAs` · Filter NDA requests — _no seeder_
- `/trust-center/NDAs` · Tab navigation (Requested/Approved/Signed) — _no seeder_
- `/trust-center/NDAs` · Approve single NDA request — _no seeder_
- `/trust-center/NDAs` · Deny single NDA request — _no seeder_
- `/trust-center/NDAs` · Approve all NDA requests (bulk) — _no seeder_
- `/trust-center/NDAs` · Revoke document access (bulk) — _no seeder_
- `/trust-center/analytics` · View analytics iframe when access link exists — _no seeder — test org has no TrustCenter row with pirschAccessLink configured_
- `/trust-center/analytics` · View 'unlock analytics' message when no custom domain configured — _no seeder — deferred per trust-center.md; layout errors before component renders_
- `/trust-center/analytics` · Navigate to add custom domain from locked state — _no seeder — deferred per trust-center.md; requires TrustCenter row_
- `/trust-center/analytics` · View domain-configured-but-no-access state — _no seeder — edge case requiring specific TrustCenter state_
- `/trust-center/analytics` · Contact support from domain-configured-no-access state — _no seeder — edge case requiring specific TrustCenter state_
- `/trust-center/branding` · tab navigation (preview/published view toggle) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · upload logo with preview update — _no seeder for creating TrustCenter_
- `/trust-center/branding` · upload favicon with preview update — _no seeder for creating TrustCenter_
- `/trust-center/branding` · set/update primary brand color (easy mode) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · set/update advanced theme colors (foreground/background/accent/secondary) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · toggle theme mode (easy vs advanced) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · select font family — _no seeder for creating TrustCenter_
- `/trust-center/branding` · enter company name/domain/description — _no seeder for creating TrustCenter_
- `/trust-center/branding` · enter security contact email with validation — _no seeder for creating TrustCenter_
- `/trust-center/branding` · enter status page URL — _no seeder for creating TrustCenter_
- `/trust-center/branding` · enter title and overview text (rich editor) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · preview branding changes (save to preview) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · publish branding changes (promote preview to published) — _no seeder for creating TrustCenter_
- `/trust-center/branding` · revert changes from preview to published state — _no seeder for creating TrustCenter_
- `/trust-center/branding` · readonly view of published branding settings — _no seeder for creating TrustCenter_
- `/trust-center/branding` · validation errors for email format and required fields — _no seeder for creating TrustCenter_
- `/trust-center/branding` · dirty state tracking with unsaved changes warning — _no seeder for creating TrustCenter_
- `/trust-center/customer-logos` · view customer logos list — _no seeder for trust-center entities; requires setup via API or seeded test data_
- `/trust-center/domain` · view default domain — _no-seeder: TrustCenter row must be created by backend seeder; fresh seedLoggedInUser orgs hit error page_
- `/trust-center/domain` · create custom domain — _no-seeder: TrustCenter row must be created by backend seeder_
- `/trust-center/domain` · edit custom domain — _no-seeder: TrustCenter row must be created by backend seeder_
- `/trust-center/domain` · delete custom domain — _no-seeder: TrustCenter row must be created by backend seeder_
- `/trust-center/domain` · copy default domain URL — _no-seeder: TrustCenter row must be created by backend seeder_
- `/trust-center/domain` · verify DNS — _no-seeder: TrustCenter row must be created by backend seeder; real DNS verification out-of-scope_
- `/trust-center/domain` · view CNAME instructions — _no-seeder: requires custom domain to exist_
- `/trust-center/domain` · view TXT instructions — _no-seeder: requires custom domain to exist_
- `/trust-center/domain` · copy CNAME record values — _no-seeder: requires custom domain to exist_
- `/trust-center/domain` · copy TXT record values — _no-seeder: requires custom domain to exist_
- `/trust-center/domain` · refresh verification status — _no-seeder: requires custom domain to exist_
- `/trust-center/domain` · validate domain input — _no-seeder: TrustCenter row must be created by backend seeder_
- `/trust-center/domain` · permission gating for edit/delete — _no-seeder: TrustCenter row must be created by backend seeder_
- `/trust-center/faqs` · Create FAQ with question, answer, and reference link — _no seeder for trust-center data; full coverage deferred per trust-center.md_
- `/trust-center/faqs` · List FAQs with drag-and-drop reordering — _no seeder for trust-center data; full coverage deferred per trust-center.md_
- `/trust-center/faqs` · Edit existing FAQ inline (question, answer, reference link) — _no seeder for trust-center data; full coverage deferred per trust-center.md_
- `/trust-center/faqs` · Delete FAQ with confirmation dialog — _no seeder for trust-center data; full coverage deferred per trust-center.md_
- `/trust-center/faqs` · Drag-and-drop reorder FAQs by display order — _dnd-kit reorder; no seeder for trust-center data_
- `/trust-center/faqs` · Permission-based edit/delete visibility (owner/member vs readonly) — _no seeder for trust-center data_
- `/trust-center/faqs` · External reference link navigation — _no seeder for trust-center data_
- `/trust-center/faqs` · Success/error notification feedback — _no seeder for trust-center data_
- `/trust-center/faqs` · Disable create form when editing an FAQ — _no seeder for trust-center data_
- `/trust-center/frameworks` · View frameworks list (recommended + all others) — _no-seeder: trust-center root layout requires TrustCenter row to exist for org; test orgs have none configured_
- `/trust-center/frameworks` · Toggle framework association via switch — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Publish framework changes (bulk create/delete compliance) — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Add custom framework via dialog — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Edit custom framework (title, description, logo) — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Delete custom framework (with confirmation) — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Hide unselected frameworks toggle — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Filter by associated/unassociated — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Infinite scroll pagination — _no-seeder: blocked by trust-center configuration requirement_
- `/trust-center/frameworks` · Permission-gated edit/publish for owner only — _no-seeder: blocked by trust-center configuration requirement; requires member/readonly permission testing_
- `/trust-center/overview` · View analytics cards — _no seeder — TrustCenter must exist for org to proceed past error page_
- `/trust-center/overview` · View latest updates feed — _no seeder — TrustCenter must exist for org to proceed past error page_
- `/trust-center/overview` · Navigate via suggested action cards — _no seeder — TrustCenter must exist for org to proceed past error page_
- `/trust-center/overview` · View live preview with status — _no seeder — TrustCenter must exist for org to proceed past error page_
- `/trust-center/reports-and-certifications` · view-documents-list-with-pagination — _no-seeder: trust-center row must be created for org before any docs can be listed; test org has no trust center configured_
- `/trust-center/reports-and-certifications` · search-documents-by-title — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · filter-by-category — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · filter-by-visibility — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · filter-by-standard — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · column-visibility-menu — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · create-document-with-file-upload — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · edit-document-metadata — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · delete-document-with-confirmation — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · preview-document-file — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · toggle-document-watermark — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · bulk-select-documents — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · bulk-edit-category — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · bulk-edit-visibility — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · bulk-delete-with-confirmation — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · apply-watermark-config — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · link-document-to-standard — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · add-document-tags — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/reports-and-certifications` · set-document-visibility-with-nda-warning — _no-seeder: blocked by missing trust-center setup_
- `/trust-center/subprocessors` · mode-toggle-manage-link — _no-seeder_
- `/trust-center/subprocessors` · search-subprocessors — _no-seeder_
- `/trust-center/subprocessors` · filter-by-category — _no-seeder_
- `/trust-center/subprocessors` · column-visibility-menu — _no-seeder_
- `/trust-center/subprocessors` · create-custom-subprocessor — _no-seeder_
- `/trust-center/subprocessors` · add-existing-subprocessor — _no-seeder_
- `/trust-center/subprocessors` · edit-subprocessor-detail — _no-seeder_
- `/trust-center/subprocessors` · delete-single-subprocessor — _no-seeder_
- `/trust-center/subprocessors` · bulk-delete-subprocessors — _no-seeder_
- `/trust-center/subprocessors` · export-csv — _no-seeder_
- `/trust-center/subprocessors` · embed-snippet — _no-seeder_
- `/trust-center/subprocessors` · save-external-url — _no-seeder_
- `/trust-center/subprocessors` · switch-mode-confirmation — _no-seeder_

### user-management

- `/user-management/groups` · bulk CSV create — _GenericBulkCSVCreateDialog in menu, no seeder_

### verify

- `/verify` · verify token and auto-signin — _requires email/invite tokens — out-of-scope_
