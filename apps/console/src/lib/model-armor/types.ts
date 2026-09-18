export type ModelArmorMatchState = 'MATCH_STATE_UNSPECIFIED' | 'NO_MATCH_FOUND' | 'MATCH_FOUND'
export type ModelArmorExecutionState = 'EXECUTION_STATE_UNSPECIFIED' | 'EXECUTION_SUCCESS' | 'EXECUTION_SKIPPED' | 'EXECUTION_FAILURE'
export type ModelArmorInvocationResult = 'INVOCATION_RESULT_UNSPECIFIED' | 'SUCCESS' | 'PARTIAL' | 'FAILURE'

export type ModelArmorFilterOutcome = {
  matchState?: ModelArmorMatchState
  executionState?: ModelArmorExecutionState
}

export type ModelArmorFilterResults = {
  csam?: { csamFilterFilterResult?: ModelArmorFilterOutcome }
  malicious_uris?: { maliciousUriFilterResult?: ModelArmorFilterOutcome }
  pi_and_jailbreak?: { piAndJailbreakFilterResult?: ModelArmorFilterOutcome }
  rai?: { raiFilterResult?: ModelArmorFilterOutcome & { raiFilterTypeResults?: Record<string, ModelArmorFilterOutcome> } }
  sdp?: {
    sdpFilterResult?: {
      inspectResult?: ModelArmorFilterOutcome
      deidentifyResult?: ModelArmorFilterOutcome & { data?: { text?: string } }
    }
  }
}

export type ModelArmorSanitizationResult = {
  invocationResult?: ModelArmorInvocationResult
  filterMatchState?: ModelArmorMatchState
  filterResults?: ModelArmorFilterResults
}

export type ModelArmorSanitizeResponse = {
  sanitizationResult?: ModelArmorSanitizationResult
}
