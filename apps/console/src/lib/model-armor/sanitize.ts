import { GoogleAuth } from 'google-auth-library'
import { modelArmorMode, modelArmorProjectID, modelArmorRegion, modelArmorTemplateID } from '@repo/dally/ai'
import { getGoogleServiceAccountCredentials } from '@/lib/google/credentials'
import { ModelArmorBlockedError, ModelArmorUnavailableError } from '@/lib/model-armor/errors'
import type { ModelArmorFilterOutcome, ModelArmorFilterResults, ModelArmorMatchState, ModelArmorSanitizationResult, ModelArmorSanitizeResponse } from '@/lib/model-armor/types'

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform'
const SANITIZE_TIMEOUT_MS = 10_000
const ERROR_BODY_CHARS = 200
const REGION_PATTERN = /^[a-z][a-z0-9-]*$/
const RESOURCE_PATTERN = /^[A-Za-z0-9_-]+$/

const configured = REGION_PATTERN.test(modelArmorRegion) && RESOURCE_PATTERN.test(modelArmorProjectID) && RESOURCE_PATTERN.test(modelArmorTemplateID)
const sanitizeUserPromptUrl = `https://modelarmor.${modelArmorRegion}.rep.googleapis.com/v1/projects/${encodeURIComponent(modelArmorProjectID)}/locations/${encodeURIComponent(modelArmorRegion)}/templates/${encodeURIComponent(modelArmorTemplateID)}:sanitizeUserPrompt`

if (modelArmorMode !== 'off' && !configured) {
  console.error(`model armor mode is "${modelArmorMode}" but its region, template or project is unset or malformed; no prompt can be screened`)
} else if (modelArmorMode === 'off' && process.env.NODE_ENV === 'production') {
  console.warn('model armor is off; prompts are reaching google ai models unscreened')
}

let auth: GoogleAuth | undefined

const getAuth = (): GoogleAuth => {
  if (!auth) {
    const credentials = getGoogleServiceAccountCredentials() ?? undefined
    auth = new GoogleAuth({ credentials, scopes: [CLOUD_PLATFORM_SCOPE] })
  }
  return auth
}

const matched = (state?: ModelArmorMatchState) => state === 'MATCH_FOUND'

const executed = (outcome?: ModelArmorFilterOutcome) => outcome?.executionState === undefined || outcome.executionState === 'EXECUTION_SUCCESS'

const namedFilters = (filters: ModelArmorFilterResults = {}): { name: string; outcome?: ModelArmorFilterOutcome }[] => [
  { name: 'responsible_ai', outcome: filters.rai?.raiFilterResult },
  { name: 'prompt_injection_or_jailbreak', outcome: filters.pi_and_jailbreak?.piAndJailbreakFilterResult },
  { name: 'malicious_uri', outcome: filters.malicious_uris?.maliciousUriFilterResult },
  { name: 'csam', outcome: filters.csam?.csamFilterFilterResult },
  { name: 'sensitive_data', outcome: filters.sdp?.sdpFilterResult?.inspectResult },
]

const deidentifiedText = (filters?: ModelArmorFilterResults): string | null => {
  const deidentify = filters?.sdp?.sdpFilterResult?.deidentifyResult
  return matched(deidentify?.matchState) ? deidentify?.data?.text || null : null
}

const raiDetail = (filters?: ModelArmorFilterResults) => {
  const types = Object.entries(filters?.rai?.raiFilterResult?.raiFilterTypeResults ?? {})
    .filter(([, outcome]) => matched(outcome.matchState))
    .map(([type]) => type)
  return types.length > 0 ? `responsible_ai(${types.join('|')})` : 'responsible_ai'
}

const blockingReasons = (result: ModelArmorSanitizationResult, wasRedacted: boolean): string[] => {
  const reasons = namedFilters(result.filterResults)
    .filter(({ name, outcome }) => matched(outcome?.matchState) && !(name === 'sensitive_data' && wasRedacted))
    .map(({ name }) => (name === 'responsible_ai' ? raiDetail(result.filterResults) : name))

  if (reasons.length === 0 && matched(result.filterMatchState) && !wasRedacted) reasons.push('unrecognized_filter_match')

  return reasons
}

const screen = async (text: string, signal?: AbortSignal): Promise<ModelArmorSanitizationResult> => {
  let token: string | null | undefined
  try {
    token = await getAuth().getAccessToken()
  } catch (err) {
    throw new ModelArmorUnavailableError(err instanceof Error ? err.message : String(err))
  }
  if (!token) throw new ModelArmorUnavailableError('no google access token available')

  const timeout = AbortSignal.timeout(SANITIZE_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(sanitizeUserPromptUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPromptData: { text } }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new ModelArmorUnavailableError(err instanceof Error ? err.message : String(err))
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new ModelArmorUnavailableError(`sanitizeUserPrompt returned ${response.status}: ${detail.slice(0, ERROR_BODY_CHARS)}`)
  }

  const payload = (await response.json().catch(() => null)) as ModelArmorSanitizeResponse | null
  const result = payload?.sanitizationResult
  if (!result) throw new ModelArmorUnavailableError('sanitizeUserPrompt returned no sanitization result')
  if (result.invocationResult === 'FAILURE') throw new ModelArmorUnavailableError('every model armor filter failed to run')
  if (result.invocationResult === 'PARTIAL' || namedFilters(result.filterResults).some(({ outcome }) => !executed(outcome))) {
    throw new ModelArmorUnavailableError('model armor could not run every filter on this prompt, which usually means it exceeds a filter token limit')
  }

  return result
}

const unscreened = (err: ModelArmorUnavailableError, text: string): string => {
  if (modelArmorMode === 'enforce') throw err
  console.error(`${err.message}; sending the prompt unscreened because model armor is in monitor mode`)
  return text
}

export const sanitizePrompt = async (text: string, signal?: AbortSignal): Promise<string> => {
  if (modelArmorMode === 'off' || !text.trim()) return text

  if (!configured) return unscreened(new ModelArmorUnavailableError('region, template or project is unset or malformed'), text)

  let result: ModelArmorSanitizationResult
  try {
    result = await screen(text, signal)
  } catch (err) {
    if (err instanceof ModelArmorUnavailableError) return unscreened(err, text)
    throw err
  }

  const redacted = deidentifiedText(result.filterResults)
  const reasons = blockingReasons(result, redacted !== null)

  if (modelArmorMode === 'monitor') {
    if (reasons.length > 0) console.warn(`model armor matched ${reasons.join(', ')}; sending the prompt anyway because it is in monitor mode`)
    return text
  }

  if (reasons.length > 0) throw new ModelArmorBlockedError(reasons)

  return redacted ?? text
}
