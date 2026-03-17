import { type CSSProperties } from 'react'

const SEVERITY_CSS_VARS: Record<string, string> = {
  critical: '--color-severity-critical',
  high: '--color-severity-high',
  medium: '--color-severity-medium',
  low: '--color-severity-low',
}

const getSeverityCssVar = (severity: string): string | null => {
  const s = severity.toLowerCase()
  if (s.includes('critical')) return SEVERITY_CSS_VARS.critical
  if (s.includes('high')) return SEVERITY_CSS_VARS.high
  if (s.includes('medium') || s.includes('med')) return SEVERITY_CSS_VARS.medium
  if (s.includes('low')) return SEVERITY_CSS_VARS.low
  return null
}

export const getSeverityStyle = (severity: string): CSSProperties => {
  const cssVar = getSeverityCssVar(severity)
  if (!cssVar) return {}
  return {
    color: `var(${cssVar})`,
    backgroundColor: `color-mix(in srgb, var(${cssVar}) 10%, transparent)`,
  }
}
