import { type Value } from 'platejs'

export type ParsedRevision = { major: number; minor: number; patch: number }

export const parseRevision = (rev: string | null | undefined): ParsedRevision | null => {
  if (!rev) return null
  const stripped = rev.startsWith('v') || rev.startsWith('V') ? rev.slice(1) : rev
  const parts = stripped.split('.')
  if (parts.length < 3) return null
  const [major, minor, patch] = parts.map((p) => parseInt(p, 10))
  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) return null
  return { major, minor, patch }
}

export const getRevisionKind = (rev: string | null | undefined): 'major' | 'minor' => {
  const parsed = parseRevision(rev)
  if (!parsed) return 'minor'
  return parsed.minor === 0 && parsed.patch === 0 ? 'major' : 'minor'
}

export const toPlateValue = (json: unknown): Value | null => (Array.isArray(json) ? (json as Value) : null)
