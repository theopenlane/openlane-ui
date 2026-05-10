# Exposure Plan

Routes: `(protected)/exposure/{overview,risks,scans,findings,vulnerabilities,remediations,reviews}`.

Tier: **2**.

## Overview

- [ ] Risk-summary chart renders (counts by severity).
- [ ] Remediation status widget (open / in-progress / resolved).
- [ ] Scan status widget (last scan, coverage).
- [ ] Quick links navigate to the relevant subroute.

## Risks (`exposure/risks`)

- [x] List page renders the "Risks" heading. _(exposure.spec.ts)_
- [ ] List: columns title, severity, status, owner, due date.
- [x] Search filters server-side — typing one risk name removes the other from the list. _(exposure.spec.ts — name search only; severity/status/owner filters not yet covered)_
- [x] Create risk: title-only happy path → save → lands on `/exposure/risks/[id]` with the risk name as the PageHeading. _(exposure.spec.ts)_
- [x] Required validation: submitting `/exposure/risks/create` without a name shows `Name is required`. _(exposure.spec.ts)_
- [ ] Detail tabs: overview, findings, vulnerabilities, action plans, remediation timeline, evidence, approval status.
- [ ] Edit risk fields → persist.
- [ ] Action plan dialog: define steps, owner, timeline → save.
- [ ] Status transitions: Draft → Open → In-Progress → Resolved → Closed (verify exact set).
- [ ] Bulk CSV create.
- [ ] Delete (soft).

## Scans (`exposure/scans`)

> **Out of scope:** actual domain scan execution (hits external scanner
> infrastructure). See [`00-priorities.md`](00-priorities.md). We test the UI
> shell, not real scan results.

- [x] List page renders the "Scans" heading. _(exposure.spec.ts)_
- [ ] List of historical scans renders (against backend-seeded rows).
- [ ] Domain-scan form validates required fields.
- [ ] Domain-scan form submit sends the expected mutation (assert via network, do not block on a result).
- [ ] Open a seeded scan's detail → findings list renders.
- [ ] Export scan report on a seeded scan (assert download response).

## Findings (`exposure/findings`)

- [x] List page renders the "Findings" heading. _(exposure.spec.ts)_
- [ ] Search + filter (severity, type, source, status).
- [ ] Detail view shows remediation guidance.
- [ ] Link finding to risk via dialog.
- [ ] Update finding status (reviewed / remediated / false positive / accepted).
- [ ] Bulk export.

## Vulnerabilities (`exposure/vulnerabilities`)

- [x] List page renders the "Vulnerabilities" heading. _(exposure.spec.ts)_
- [ ] Read-mostly list (CVE id, name, severity, affected systems, status).
- [ ] Detail with CVE info + affected assets.
- [ ] Create risk from vulnerability via action button.
- [ ] Track remediation: mark fixed/mitigated/accepted.

## Remediations (`exposure/remediations`)

- [x] List page renders the "Remediations" heading. _(exposure.spec.ts)_
- [ ] List with related risk/finding, owner, due date, status.
- [ ] Create remediation from a risk or finding.
- [ ] Detail: steps, timeline, evidence.
- [ ] Mark step complete → progress bar updates.
- [ ] Close remediation → state moves to "Completed".

## Reviews (`exposure/reviews`)

- [x] List page renders the "Reviews" heading. _(exposure.spec.ts)_
- [ ] List of comments/approvals.
- [ ] Add review comment on a risk/finding.
- [ ] Approve / request changes.

## Permissions

- [ ] ReadOnly cannot create risks, action plans, remediations, or reviews.
