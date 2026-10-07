'use client'

import React from 'react'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { ImportStepNav } from './import-step-nav'
import { type TImportExit } from './lib/use-import-exit'
import { type TImportFlowState } from './lib/use-record-import'

type TImportFlowLayoutProps = {
  heading: string
  exit: TImportExit
  state: TImportFlowState
  canContinue: boolean
  isBusy: boolean
  footerHint: string
  finalAction: React.ReactNode
  children: React.ReactNode
}

export const ImportFlowLayout: React.FC<TImportFlowLayoutProps> = ({ heading, exit, state, canContinue, isBusy, footerHint, finalAction, children }) => {
  const navGuard = useNavigationGuard({ enabled: Boolean(state.parsed) && !exit.isFinished })

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="flex flex-col items-start gap-4">
        <Button variant="secondary" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={exit.leave} disabled={isBusy}>
          {exit.backLabel}
        </Button>
        <PageHeading heading={heading} subheading="Upload your file and we'll help you map the columns to Openlane fields." />
      </div>

      <ImportStepNav steps={state.steps} current={state.step} />

      {children}

      <div className="sticky bottom-0 z-10 mt-auto flex flex-wrap items-center justify-end gap-3 border-t bg-secondary py-4 pr-10 after:absolute after:inset-x-0 after:top-full after:h-8 after:bg-secondary">
        <div className="mr-auto">
          {!state.isFirstStep && (
            <Button variant="outline" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={state.goBack} disabled={isBusy}>
              Back
            </Button>
          )}
        </div>
        <span role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {footerHint}
        </span>
        {state.isLastStep ? (
          finalAction
        ) : (
          <Button variant="primary" icon={<ArrowRight size={16} />} onClick={state.goNext} disabled={!canContinue}>
            Continue
          </Button>
        )}
      </div>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />
    </div>
  )
}
