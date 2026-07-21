import React from 'react'
import { Check, Circle, Loader2, Radar, Sparkles } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'

type StepStatus = 'done' | 'in-progress' | 'pending'
type SubmitStage = 'form' | 'transition' | 'ready'

const buildSteps = (currentIndex: number, stage: SubmitStage): { label: string; status: StepStatus }[] => {
  if (stage !== 'form') {
    return [
      { label: 'Company profile', status: 'done' },
      { label: 'Compliance frameworks', status: 'done' },
      { label: 'Onboarding preferences', status: 'done' },
      { label: 'Domain scan', status: stage === 'transition' ? 'in-progress' : 'done' },
    ]
  }

  return [
    { label: 'Company profile', status: currentIndex >= 2 ? 'done' : 'in-progress' },
    { label: 'Compliance frameworks', status: currentIndex >= 3 ? 'done' : currentIndex === 2 ? 'in-progress' : 'pending' },
    { label: 'Onboarding preferences', status: currentIndex >= 3 ? 'in-progress' : 'pending' },
    { label: 'Domain scan', status: 'pending' },
  ]
}

const statusLabel: Record<StepStatus, string> = {
  done: 'Completed',
  'in-progress': 'In progress',
  pending: 'Pending',
}

const bannerCopy: Record<SubmitStage, { title: string; description: string; scanning: boolean }> = {
  form: { title: 'Getting things ready', description: "We'll scan your domain once you submit.", scanning: false },
  transition: { title: 'Scan in progress', description: "We'll keep scanning in the background.", scanning: true },
  ready: { title: 'Results ready', description: 'Your setup is ready for review.', scanning: false },
}

const SetupProgressCard = ({ currentIndex, stage }: { currentIndex: number; stage: SubmitStage }) => {
  const steps = buildSteps(currentIndex, stage)
  const banner = bannerCopy[stage]

  return (
    <Card className="flex h-80 w-full flex-col gap-4 p-5">
      <p className="text-sm font-semibold">Setup progress</p>

      <div className="flex flex-col gap-3">
        {steps.map(({ label, status }) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${status === 'done' ? 'border-btn-primary bg-transparent shadow-primary16' : 'border-border bg-muted'}`}
            >
              {status === 'done' ? (
                <Check size={14} className="text-btn-primary" />
              ) : status === 'in-progress' ? (
                <Loader2 size={14} className="animate-spin text-btn-primary" />
              ) : (
                <Circle size={10} className="text-text-light" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-text-light">{statusLabel[status]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/60 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-btn-primary/10">
            {banner.scanning ? <Radar size={16} className="text-btn-primary animate-pulse" /> : <Sparkles size={16} className="text-btn-primary" />}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold">{banner.title}</span>
            <span className="text-xs text-text-light">{banner.description}</span>
          </div>
        </div>
        <div className={`h-2 w-2 shrink-0 rounded-full bg-btn-primary ${banner.scanning ? 'animate-pulse' : ''}`} />
      </div>
    </Card>
  )
}

export default SetupProgressCard
