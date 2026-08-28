# Core issues found by the E2E suite

Backend defects in [`theopenlane/core`](https://github.com/theopenlane/core) that
this suite reproduces but cannot fix. Each entry is written to be filed as-is.

When a test has to work around one of these, say so at the workaround and link
back here — otherwise the workaround looks like an arbitrary choice later.

---

## CORE-1 · Updating an entity fails when an optional enum was never set

**Severity:** high — the affected records are permanently uneditable, and the
failure is silent in the UI.

### Summary

`updateActionPlan` fails for any action plan whose `priority` was never set. The
mutation is rejected outright, so **no field can be edited** — not the name, not
the title, nothing. The console shows no error toast; the sheet closes as though
the save succeeded.

```
historygenerated: validator failed for field "ActionPlanHistory.priority":
actionplanhistory: invalid enum value for priority field: ""
```

### Reproduce

```bash
# 1. create an action plan without a priority (the API allows it — the field is Optional)
mutation { createActionPlan(input: { name: "repro", title: "repro" }) { actionPlan { id } } }

# 2. update any unrelated field
mutation { updateActionPlan(id: "<id>", input: { name: "repro renamed" }) { actionPlan { id } } }
# -> errors: historygenerated: validator failed for field "ActionPlanHistory.priority"
```

The failing request carries **no `priority` and no `clearPriority`** — verified by
intercepting it in the browser. Nothing the client sends can avoid it.

### Root cause

`priority` is `Optional()` but not `Nillable()`, so an unset value is persisted as
the enum zero value `""`:

- `internal/ent/schema/actionplan.go:67-73` — `field.Enum("priority").GoType(enums.Priority("")).Optional()`

On update, the history hook copies **every** current column into a new
`ActionPlanHistory` row, including the empty `priority`, and that builder runs a
validator which does not accept `""`:

- `internal/ent/historygenerated/actionplanhistory/actionplanhistory.go:288-296`

```go
func PriorityValidator(pr enums.Priority) error {
	switch pr.String() {
	case "LOW", "MEDIUM", "HIGH", "CRITICAL":
		return nil
	default:
		return fmt.Errorf("actionplanhistory: invalid enum value for priority field: %q", pr)
	}
}
```

The entity's own validator (`internal/ent/generated/actionplan/actionplan.go:477`)
is identical, but it never fires on this path because the field isn't being
mutated. Only the history builder, which sets all fields, trips it.

Sending `clearPriority: true` does not help — it moves the same error onto
`review_frequency`, the next optional enum.

### Suggested fix

Any of, in preference order:

1. Make optional enum fields `Optional().Nillable()` so unset stays `NULL`
   instead of becoming `""`.
2. Have the generated validators accept the zero value for optional fields.
3. Have the history builder skip optional fields that hold the zero value.

### Blast radius

**48 optional-non-nillable enum fields across 30 schemas** carry the same shape
(`risk.status`, `risk.impact`, `risk.likelihood`, `evidence.status`,
`template.kind`, `organizationsetting.geo_location`, `user.role`, …). Only action
plans were verified — the bug manifests where such a field is genuinely left
unset on a history-tracked entity, so the real count is somewhere between 1 and
48 and is worth a sweep rather than a point fix.

### Why the console mostly hides it

The create form defaults `priority` to `MEDIUM`
(`action-plans/hooks/use-form-schema.ts`), so plans created through the UI are
fine. Plans created via the API, bulk CSV import, or any integration that omits
priority are permanently uneditable.

### Test workaround

`apps/console/e2e/tests/exposure-action-plans-crud.spec.ts` seeds with
`priority: 'MEDIUM'` so the edit and delete paths are exercised at all. **The
suite therefore does not cover the NULL-priority case and will not catch a
regression here** — remove the workaround once this is fixed.
