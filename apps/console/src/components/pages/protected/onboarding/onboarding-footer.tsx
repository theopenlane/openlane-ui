'use client'

import { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ONBOARDING_FOOTER_HEIGHT_VAR } from '@/constants/layout'
import { useElementHeight } from '@/hooks/useElementHeight'
import { useDashboardContentOffset } from '@/providers/DashboardContentOffsetContext'
import { CONTENT_LEFT_COLUMN_CLASS, CONTENT_RIGHT_COLUMN_CLASS, FOOTER_BUTTON_CLASS } from './onboarding-layout-classes'

type OnboardingFooterProps = {
  showExit: boolean
  onExit: () => void
  isFirstStep: boolean
  isLastStep: boolean
  backLabel?: string
  nextLabel?: string
  isNextDisabled: boolean
  isSubmitting: boolean
  onBack: () => void
  onNext: () => void
}

const ExitOnboardingLink = ({ onExit, disabled }: { onExit: () => void; disabled: boolean }) => (
  <p className="text-sm">
    <button type="button" className="bg-transparent text-blue-500 disabled:opacity-50" onClick={onExit} disabled={disabled}>
      Exit the onboarding process
    </button>
    <span> and use general template for my account.</span>
  </p>
)

const OnboardingFooter = ({ showExit, onExit, isFirstStep, isLastStep, backLabel, nextLabel, isNextDisabled, isSubmitting, onBack, onNext }: OnboardingFooterProps) => {
  const contentOffset = useDashboardContentOffset()
  const containerRef = useRef<HTMLDivElement>(null)
  const height = useElementHeight(containerRef)

  useEffect(() => {
    const root = document.documentElement

    if (height > 0) {
      root.style.setProperty(ONBOARDING_FOOTER_HEIGHT_VAR, `${height}px`)
    } else {
      root.style.removeProperty(ONBOARDING_FOOTER_HEIGHT_VAR)
    }

    return () => {
      root.style.removeProperty(ONBOARDING_FOOTER_HEIGHT_VAR)
    }
  }, [height])

  return (
    <div ref={containerRef} className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur" style={{ marginLeft: contentOffset.marginLeft, marginRight: contentOffset.marginRight }}>
      <div className="flex w-full max-w-6xl mx-auto gap-10 px-4 py-4">
        <div className={`hidden lg:flex items-center ${CONTENT_LEFT_COLUMN_CLASS}`}>{showExit && <ExitOnboardingLink onExit={onExit} disabled={isSubmitting} />}</div>
        <div className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between ${CONTENT_RIGHT_COLUMN_CLASS}`}>
          <div className="lg:hidden">{showExit && <ExitOnboardingLink onExit={onExit} disabled={isSubmitting} />}</div>
          <div className="flex items-center gap-3 lg:ml-auto">
            {!isFirstStep && (
              <Button type="button" onClick={onBack} variant="secondary" icon={<ArrowLeft />} iconPosition="left" disabled={isSubmitting} className={FOOTER_BUTTON_CLASS}>
                {backLabel}
              </Button>
            )}
            <Button type="button" onClick={onNext} icon={<ArrowRight />} disabled={isNextDisabled || isSubmitting} loading={isSubmitting} className={FOOTER_BUTTON_CLASS}>
              {isLastStep ? 'Submit' : nextLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFooter
