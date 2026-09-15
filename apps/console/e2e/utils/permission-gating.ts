export const PERMISSION_GATES_ENABLED = process.env.E2E_PERMISSION_GATES === '1'

export const PERMISSION_GATES_SKIP_REASON = 'permission gating ships in its own PR — run with E2E_PERMISSION_GATES=1 once those changes land'
