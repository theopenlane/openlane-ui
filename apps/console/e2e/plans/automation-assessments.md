# Automation: Assessments Plan

Routes:

- `(protected)/automation/assessments`
- `automation/assessments/[id]`
- `automation/assessments/templates`
- `automation/assessments/templates/{template-editor,template-viewer}`
- `automation/assessments/{questionnaire-editor,questionnaire-viewer}`

Tier: **3** — multi-actor flow; split into admin spec + respondent spec.

## Templates

- [ ] List templates with metadata.
- [ ] Open template-editor: add multiple-choice question, text question, rating, etc.
- [ ] Reorder questions (drag).
- [ ] Edit options on a multi-choice question.
- [ ] Save template.
- [ ] Open template-viewer for a saved template — preview matches editor state.
- [ ] Duplicate template → new copy with edits independent.
- [ ] Delete template confirmation.

## Questionnaire editor / viewer

- [ ] Create questionnaire: add sections, questions with validation rules.
- [ ] Reorder sections.
- [ ] Save.
- [ ] Viewer preview reflects saved structure.
- [ ] Duplicate → independent copy.

## Assessments

- [x] /automation/assessments renders the "Questionnaires" heading. _(automation-other.spec.ts)_
- [ ] List assessments: name, template, status, due date, respondents.
- [ ] Filter by status, template, due date.
- [ ] Create assessment: pick template → choose respondents → due date → create.
- [ ] Bulk create (multiple respondents from one template).
- [ ] Detail: questions, response status per respondent, completion %.
- [ ] Export results (CSV / JSON — verify).

## Respondent flow (separate spec, no auth state)

- [ ] Open assessment link with token → form renders.
- [ ] Required-field validation per question.
- [ ] Save progress / draft (verify whether supported).
- [ ] Submit → confirmation screen.
- [ ] Resubmit blocked or allowed? (verify product rule).
- [ ] Invalid token → error screen.
- [ ] Expired token → error screen.

## Permissions

- [ ] ReadOnly admin cannot edit templates / questionnaires / assessments.
