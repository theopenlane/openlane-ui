import { type CSSProperties } from 'react'
import { tintedTextColor } from '@/utils/color-contrast'

export type TSeverityLevel = 'critical' | 'high' | 'medium' | 'low'

export const SEVERITY_LEVELS: TSeverityLevel[] = ['critical', 'high', 'medium', 'low']

const SEVERITY_CSS_VARS: Record<TSeverityLevel, string> = {
  critical: '--color-severity-critical',
  high: '--color-severity-high',
  medium: '--color-severity-medium',
  low: '--color-severity-low',
}

export const toSeverityLevel = (severity: string | null | undefined): TSeverityLevel | null => {
  const value = severity?.toLowerCase() ?? ''
  if (value.includes('critical')) return 'critical'
  if (value.includes('high')) return 'high'
  if (value.includes('med') || value.includes('moderate')) return 'medium'
  if (value.includes('low')) return 'low'
  return null
}

export const getSeverityCssVar = (severity: string): string | null => {
  const level = toSeverityLevel(severity)
  return level && SEVERITY_CSS_VARS[level]
}

export const getSeverityColor = (level: TSeverityLevel): string => `var(${SEVERITY_CSS_VARS[level]})`

export const getSeverityStyle = (severity: string): CSSProperties => {
  const cssVar = getSeverityCssVar(severity)
  if (!cssVar) return {}
  return {
    color: tintedTextColor(`var(${cssVar})`),
    backgroundColor: `color-mix(in srgb, var(${cssVar}) 10%, transparent)`,
  }
}
