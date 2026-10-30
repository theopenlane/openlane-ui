import { formatList } from './strings'

export type TCvssVersion = '3.0' | '3.1' | '4.0'

export const CVSS_VECTOR_ERROR = 'Enter a valid CVSS 3.x or 4.0 vector.'

export type TCvssMetrics = Record<string, string>

export type TParsedCvssVector = {
  version: TCvssVersion
  metrics: TCvssMetrics
}

export type TCvssRadarPoint = {
  axis: string
  value: number
  tooltip: string
}

export type TCvssSeverityBand = {
  label: 'None' | 'Low' | 'Medium' | 'High' | 'Critical'
  min: number
  max: number
}

type TMetricScale = Record<string, readonly string[]>

const IMPACT_SCALE = ['N', 'L', 'H'] as const

const V3_BASE_METRICS: TMetricScale = {
  AV: ['P', 'L', 'A', 'N'],
  AC: ['H', 'L'],
  PR: ['H', 'L', 'N'],
  UI: ['R', 'N'],
  S: ['U', 'C'],
  C: IMPACT_SCALE,
  I: IMPACT_SCALE,
  A: IMPACT_SCALE,
}

const V4_BASE_METRICS: TMetricScale = {
  AV: ['P', 'L', 'A', 'N'],
  AC: ['H', 'L'],
  AT: ['P', 'N'],
  PR: ['H', 'L', 'N'],
  UI: ['A', 'P', 'N'],
  VC: IMPACT_SCALE,
  VI: IMPACT_SCALE,
  VA: IMPACT_SCALE,
  SC: IMPACT_SCALE,
  SI: IMPACT_SCALE,
  SA: IMPACT_SCALE,
}

const VERSION_PREFIXES: Record<string, TCvssVersion> = {
  'CVSS:3.0': '3.0',
  'CVSS:3.1': '3.1',
  'CVSS:4.0': '4.0',
}

const baseMetricsFor = (version: TCvssVersion): TMetricScale => (version === '4.0' ? V4_BASE_METRICS : V3_BASE_METRICS)

const METRIC_TOKEN = /^([A-Za-z]+):([A-Za-z0-9]+)$/

export const parseCvssVector = (vector: string | null | undefined): TParsedCvssVector | null => {
  if (!vector) return null
  const [prefix, ...parts] = vector.trim().split('/').filter(Boolean)
  const version = Object.hasOwn(VERSION_PREFIXES, prefix) ? VERSION_PREFIXES[prefix] : undefined
  if (!version || parts.length === 0) return null

  const metrics: TCvssMetrics = {}
  for (const part of parts) {
    const match = METRIC_TOKEN.exec(part)
    if (!match) return null
    const [, key, value] = match
    if (Object.hasOwn(metrics, key)) return null
    metrics[key] = value
  }

  const baseMetrics = baseMetricsFor(version)
  const hasValidBase = Object.entries(baseMetrics).every(([key, values]) => values.includes(metrics[key]))
  return hasValidBase ? { version, metrics } : null
}

export const getCvssRadarData = (parsed: TParsedCvssVector): TCvssRadarPoint[] =>
  Object.entries(baseMetricsFor(parsed.version)).map(([metric, scale]) => {
    const value = parsed.metrics[metric]
    const rank = scale.indexOf(value)
    return { axis: metric, value: scale.length > 1 ? rank / (scale.length - 1) : 0, tooltip: `${metric}: ${value}` }
  })

const ATTACK_VECTOR: TCvssMetrics = {
  N: 'over the network',
  A: 'from an adjacent network',
  L: 'locally',
  P: 'with physical access to the device',
}

const PRIVILEGES: TCvssMetrics = {
  N: 'without an account',
  L: 'by a signed-in user',
  H: 'by a user with admin access',
}

const USER_INTERACTION_V3: TCvssMetrics = {
  N: 'with no user interaction',
  R: 'but only if a user takes an action',
}

const USER_INTERACTION_V4: TCvssMetrics = {
  N: 'with no user interaction',
  P: 'if a user does something ordinary, like opening a page',
  A: 'but only if a user takes a specific action',
}

const COMPLEXITY_V3: TCvssMetrics = { H: 'It only works under conditions the attacker can’t fully control.' }

const COMPLEXITY_V4: TCvssMetrics = { H: 'It only works if the attacker can get around security measures in place.' }

const ATTACK_REQUIREMENTS: TCvssMetrics = { P: 'It only works when specific conditions are present on the target.' }

type TImpactPhrases = Record<'C' | 'I' | 'A', TCvssMetrics>

const ACTIVE_IMPACT: TImpactPhrases = {
  C: { H: 'read sensitive data', L: 'read some data' },
  I: { H: 'change any data', L: 'change some data' },
  A: { H: 'take it down', L: 'slow it down' },
}

const PASSIVE_IMPACT: TImpactPhrases = {
  C: { H: 'read', L: 'partly read' },
  I: { H: 'changed', L: 'partly changed' },
  A: { H: 'made unavailable', L: 'disrupted' },
}

const impactPhrases = (phrases: TImpactPhrases, confidentiality?: string, integrity?: string, availability?: string): string[] =>
  [phrases.C[confidentiality ?? ''], phrases.I[integrity ?? ''], phrases.A[availability ?? '']].filter((phrase): phrase is string => !!phrase)

const describeV4Impact = (metrics: TCvssMetrics): string => {
  const onThis = impactPhrases(ACTIVE_IMPACT, metrics.VC, metrics.VI, metrics.VA)
  const onConnected = impactPhrases(PASSIVE_IMPACT, metrics.SC, metrics.SI, metrics.SA)

  if (!onThis.length && !onConnected.length) return 'It has no direct impact if exploited.'
  if (!onConnected.length) return `If exploited, an attacker can ${formatList(onThis)}.`
  if (!onThis.length) return `The vulnerable component itself isn’t affected, but systems connected to it can have data ${formatList(onConnected, 'disjunction')}.`
  return `If exploited, an attacker can ${formatList(onThis)}, and systems connected to it can have data ${formatList(onConnected, 'disjunction')}.`
}

const describeV3Impact = (metrics: TCvssMetrics): string[] => {
  const impact = impactPhrases(ACTIVE_IMPACT, metrics.C, metrics.I, metrics.A)
  const sentences = [impact.length ? `If exploited, an attacker can ${formatList(impact)}.` : 'It has no direct impact if exploited.']
  if (metrics.S === 'C') sentences.push('The impact can spread beyond the vulnerable component.')
  return sentences
}

export const explainCvssVector = (vector: string | null | undefined): string | null => {
  const parsed = parseCvssVector(vector)
  return parsed ? explainParsedCvssVector(parsed) : null
}

export const explainParsedCvssVector = ({ version, metrics }: TParsedCvssVector): string => {
  const isV4 = version === '4.0'
  const how = [ATTACK_VECTOR[metrics.AV], PRIVILEGES[metrics.PR]].filter(Boolean).join(' ')
  const interaction = (isV4 ? USER_INTERACTION_V4 : USER_INTERACTION_V3)[metrics.UI]
  const sentences = [`Can be exploited ${how}${interaction ? `, ${interaction}` : ''}.`]

  const complexity = (isV4 ? COMPLEXITY_V4 : COMPLEXITY_V3)[metrics.AC]
  if (complexity) sentences.push(complexity)
  if (isV4 && ATTACK_REQUIREMENTS[metrics.AT]) sentences.push(ATTACK_REQUIREMENTS[metrics.AT])

  if (isV4) sentences.push(describeV4Impact(metrics))
  else sentences.push(...describeV3Impact(metrics))

  return sentences.join(' ')
}

export const CVSS_SEVERITY_BANDS: readonly TCvssSeverityBand[] = [
  { label: 'Low', min: 0.1, max: 3.9 },
  { label: 'Medium', min: 4.0, max: 6.9 },
  { label: 'High', min: 7.0, max: 8.9 },
  { label: 'Critical', min: 9.0, max: 10 },
]

const CVSS_NONE_BAND: TCvssSeverityBand = { label: 'None', min: 0, max: 0 }

export const getCvssSeverityBand = (score: number | null | undefined): TCvssSeverityBand | null => {
  if (score === null || score === undefined || Number.isNaN(score) || score < 0 || score > 10) return null
  if (score === 0) return CVSS_NONE_BAND
  return CVSS_SEVERITY_BANDS.findLast((band) => score >= band.min) ?? CVSS_SEVERITY_BANDS[0]
}
