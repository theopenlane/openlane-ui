# Standards Plan

Routes: `(protected)/standards`, `standards/[id]`.

Tier: **3** — mostly read-only.

## List / catalog

- [x] /standards renders the "Standards Catalog" heading. _(standards.spec.ts — feature-gated behind STANDARDS/COMPLIANCE_MODULE; local dev bypasses via NEXT_PUBLIC_ENABLE_PLAN=false)_
- [ ] Grid of available standards (SOC2, ISO 27001, HIPAA, etc.).
- [ ] Search by name / code.

## Detail

- [ ] Framework tree of controls + subcontrols.
- [ ] Preview of an individual control.

## Add to organization

- [ ] "Add to org" dialog → pick programs → confirm → controls created from standard, linked to selected programs.
- [ ] Mapping status indicator on already-mapped controls.

## Permissions

- [ ] ReadOnly cannot add a standard to the org.
