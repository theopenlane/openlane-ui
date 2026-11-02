import { type ReactNode } from 'react'
import { Badge } from '@repo/ui/badge'
import { LinearBar } from '@/components/shared/linear-bar/linear-bar'

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
    <LinearBar value={progress} label="Setup progress" />
  </div>
)

export default OnboardingCardProgress
