import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { RISK_RATING_BANDS, VENDOR_RISK_RATING_SEVERITY, type TVendorRiskRating } from '@/lib/vendor-risk-rating'
import { getSeverityColor } from '@/utils/severity'

type TRiskScoreScaleProps = {
  rating: TVendorRiskRating | undefined
}

const activeBandStyle = (rating: TVendorRiskRating) => {
  const level = VENDOR_RISK_RATING_SEVERITY[rating]
  return level === 'none' ? undefined : { backgroundColor: getSeverityColor(level) }
}

export const RiskScoreScale: React.FC<TRiskScoreScaleProps> = ({ rating }) => (
  <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${RISK_RATING_BANDS.length}, minmax(0, 1fr))` }} aria-label="Default risk rating bands">
    {RISK_RATING_BANDS.map((band) => {
      const isActive = band.rating === rating
      return (
        <li key={band.rating} className="flex min-w-0 flex-col gap-1" aria-current={isActive ? 'true' : undefined}>
          <span className={cn('h-1.5 rounded-full', isActive ? 'bg-muted-foreground' : 'bg-border')} style={isActive ? activeBandStyle(band.rating) : undefined} />
          <span className={cn('hidden text-[11px] leading-tight sm:block', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{getEnumLabel(band.rating)}</span>
          <span className={cn('text-xs', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{band.bound}</span>
        </li>
      )
    })}
  </ol>
)
