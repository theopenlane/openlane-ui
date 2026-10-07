'use client'

import { ArrowRight, Zap } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { DynamicStep } from '@/components/pages/protected/onboarding/dynamic-step'
import OnboardingCardProgress from '@/components/pages/protected/onboarding/onboarding-card-progress'
import { type OnboardingStep } from '@/lib/onboarding-questions/types'

type OnboardingStartCardProps = {
  step: OnboardingStep
  totalSteps: number
  canContinue: boolean
  isDisabled: boolean
  onContinue: () => void
  onCreate: () => void
}

const OnboardingStartCard = ({ step, totalSteps, canContinue, isDisabled, onContinue, onCreate }: OnboardingStartCardProps) => (
  <form
    className="w-full"
    onSubmit={(event) => {
      event.preventDefault()
      if (!isDisabled) (canContinue ? onContinue : onCreate)()
    }}
  >
    <Card className="w-full p-5 sm:p-8 shadow-lg rounded-xl">
      <OnboardingCardProgress
        label={
          <>
            <Zap size={12} />
            Required to start
          </>
        }
        progress={1 / totalSteps}
      />

      <DynamicStep step={step} />

      <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end">
        {canContinue && (
          <Button type="submit" icon={<ArrowRight />} disabled={isDisabled}>
            Continue setup
          </Button>
        )}
        <Button type="button" variant={canContinue ? 'secondary' : 'primary'} onClick={onCreate} disabled={isDisabled}>
          Create organization now
        </Button>
      </div>
    </Card>
  </form>
)

export default OnboardingStartCard
