import { formatTimeSince } from '@/utils/date'

export const norm = (v: unknown): unknown => (v === '' || v == null ? null : v)

export const fmtStr = (v: string | null | undefined): string => (v == null || v === '' ? '—' : v)

export const fmtBool = (v: boolean | null | undefined): string => (v == null ? '—' : v ? 'Yes' : 'No')

export const fmtArr = (v: ReadonlyArray<string> | null | undefined): string => (v && v.length > 0 ? v.join(', ') : '—')

export const fmtDate = (v: string | null | undefined): string => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : formatTimeSince(v)
}

export const fmtEnum = (v: string | null | undefined, label: (s: string | undefined) => string): string => {
  if (!v) return '—'
  const out = label(v)
  return out === '' ? '—' : out
}
