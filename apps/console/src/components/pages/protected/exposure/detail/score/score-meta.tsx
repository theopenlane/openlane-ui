import React from 'react'
import { Badge } from '@repo/ui/badge'
import { parseCvssVector } from '@/utils/cvss-vector'

export const isProvidedScore = (value?: number | null): value is number => typeof value === 'number' && value > 0

export const ScoreMeta: React.FC<{ score?: number | null; vector?: string | null }> = ({ score, vector }) => {
  const cvssVersion = parseCvssVector(vector)?.version

  return (
    <>
      {isProvidedScore(score) ? <span className="font-medium">{score.toFixed(1)}</span> : <span className="text-muted-foreground">—</span>}
      {cvssVersion && <Badge variant="outline">CVSS {cvssVersion}</Badge>}
    </>
  )
}
