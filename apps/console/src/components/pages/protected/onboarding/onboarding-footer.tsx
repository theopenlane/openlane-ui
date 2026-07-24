import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useDashboardContentOffset } from '@/providers/DashboardContentOffsetContext'
import { CONTENT_LEFT_COLUMN_CLASS, CONTENT_RIGHT_COLUMN_CLASS } from './onboarding-layout-classes'

type OnboardingFooterProps = {
  showExit: boolean
  onExit: () => void
  isFirstStep: boolean
  isLastStep: boolean
  backLabel?: string
  nextLabel?: string
  isNextDisabled: boolean
  onBack: () => void
  onNext: () => void
}

const ExitOnboardingLink = ({ onExit }: { onExit: () => void }) => (
  <p className="whitespace-nowrap text-sm">
    <button type="button" className="bg-transparent text-blue-500" onClick={onExit}>
      Exit the onboarding process
    </button>
    <span> and use general template for my account.</span>
  </p>
)

const OnboardingFooter = ({ showExit, onExit, isFirstStep, isLastStep, backLabel, nextLabel, isNextDisabled, onBack, onNext }: OnboardingFooterProps) => {
  const contentOffset = useDashboardContentOffset()

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur" style={{ marginLeft: contentOffset.marginLeft, marginRight: contentOffset.marginRight }}>
      <div className="flex w-full max-w-6xl mx-auto gap-10 px-4 py-4">
        <div className={`hidden lg:flex items-center ${CONTENT_LEFT_COLUMN_CLASS}`}>{showExit && <ExitOnboardingLink onExit={onExit} />}</div>
        <div className={`flex items-center justify-between gap-10 ${CONTENT_RIGHT_COLUMN_CLASS}`}>
          <div className="lg:hidden">{showExit && <ExitOnboardingLink onExit={onExit} />}</div>
          <div className="flex items-center gap-3 ml-auto">
            {!isFirstStep && (
              <Button type="button" onClick={onBack} variant="secondary" icon={<ArrowLeft />} iconPosition="left">
                {backLabel}
              </Button>
            )}
            <Button type="button" onClick={onNext} icon={<ArrowRight />} disabled={isNextDisabled}>
              {isLastStep ? 'Submit' : nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFooter
