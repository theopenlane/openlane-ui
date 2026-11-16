import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { CVSS_SEVERITY_BANDS, getCvssSeverityBand } from '@/utils/cvss-vector'
import { getSeverityCssVar } from '@/utils/severity'
import { SectionLabel } from './section-label'

const MAX_SCORE = 10

const formatRange = (min: number, max: number) => (max >= MAX_SCORE ? `${min.toFixed(1)}+` : `${min.toFixed(1)}–${max.toFixed(1)}`)

export const CvssSeverityScale: React.FC<{ score: number }> = ({ score }) => {
  const activeBand = getCvssSeverityBand(score)
  const markerPercent = Math.min(Math.max((score / MAX_SCORE) * 100, 2), 98)

  return (
    <div className="space-y-3">
      <SectionLabel>Where {score.toFixed(1)} falls</SectionLabel>
      <div className="relative pt-7">
        <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center text-xs font-semibold" style={{ left: `${markerPercent}%` }}>
          <span>{score.toFixed(1)}</span>
          <span aria-hidden className="h-0 w-0 border-x-4 border-t-4 border-x-transparent border-t-foreground" />
        </div>
        <div className="flex gap-0.5">
          {CVSS_SEVERITY_BANDS.map((band) => {
            const width = ((Math.min(band.max, MAX_SCORE) - band.min + 0.1) / MAX_SCORE) * 100
            return (
              <div key={band.label} className="flex flex-col gap-1.5" style={{ width: `${width}%` }}>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: `var(${getSeverityCssVar(band.label)})` }} />
                <span className={cn('text-xs', activeBand?.label === band.label ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{band.label}</span>
                <span className="text-xs text-muted-foreground">{formatRange(band.min, band.max)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
