import { type ReactNode } from 'react'
import { Badge } from '@repo/ui/badge'

type OnboardingCardProgressProps = {
  label?: ReactNode
  progress: number
}

const OnboardingCardProgress = ({ label, progress }: OnboardingCardProgressProps) => (
  <div className="flex flex-col gap-3 mb-8">
    {label && (
      <Badge variant="primary" className="w-fit gap-1.5 uppercase tracking-wide border-primary/24">
        {label}
      </Badge>
    )}
    <div
      role="progressbar"
      aria-label="Setup progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      className="relative h-1.5 w-full rounded-full bg-border overflow-hidden"
    >
      <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
    </div>
  </div>
)

export default OnboardingCardProgress
