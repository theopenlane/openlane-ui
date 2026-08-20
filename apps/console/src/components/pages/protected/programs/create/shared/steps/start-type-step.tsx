'use client'
import React, { useEffect, useState } from 'react'
import { BookText, Rocket, SearchCheck } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { useFormContext, Controller, useWatch } from 'react-hook-form'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useOrganization } from '@/hooks/useOrganization'
import { getOnboardingNeedsControls } from '@/lib/storage/onboarding-frameworks'
import { useDocsHelpNavigate } from '@/components/shared/docs-help/docs-help-context'

export default function StartTypeStep() {
  const { control } = useFormContext<{ programKindName?: string }>()
  const selected = useWatch({ control, name: 'programKindName' })
  const { currentOrgId } = useOrganization()
  const navigateDocs = useDocsHelpNavigate()

  // onboarding said the org has no controls yet — gap analysis is the better
  // starting point for them
  const [recommendGapAnalysis, setRecommendGapAnalysis] = useState(false)
  useEffect(() => {
    setRecommendGapAnalysis(getOnboardingNeedsControls(currentOrgId) === true)
  }, [currentOrgId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">How do you want to get started?</h2>
        <p className="text-sm text-muted-foreground">Choose the path that best matches your current readiness. You can switch later if your needs change.</p>
        {docsHelpEnabled && (
          <button
            type="button"
            onClick={() => navigateDocs({ title: 'Gap Analysis', query: 'gap analysis', prefer: 'gapanalysis' })}
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-[var(--color-info)] hover:underline underline-offset-4"
          >
            What is a gap analysis?
            <BookText size={12} />
          </button>
        )}
      </div>

      <Controller
        name="programKindName"
        control={control}
        render={({ field }) => (
          <div className="space-y-4">
            <Card
              className={`flex flex-1 items-center gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer ${selected === 'Framework' ? 'border-primary' : 'border-border'}`}
              onClick={() => field.onChange('Framework')}
            >
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border shrink-0">
                  <Rocket className="text-primary" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-2 items-center">
                    <span className="font-medium">Ready to Start</span>
                    <Badge variant="outline" className="font-normal">
                      Ideal for teams that are audit-ready
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Jump straight into the audit process. This doesn&apos;t mean everything is already in place — just that you&apos;re preparing to begin the audit soon.
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className={`flex flex-1 items-center gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer ${selected === 'Gap Analysis' || recommendGapAnalysis ? 'border-primary' : 'border-border'}`}
              onClick={() => field.onChange('Gap Analysis')}
            >
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border shrink-0">
                  <SearchCheck className="text-primary" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-2 items-center">
                    <span className="font-medium">Gap Analysis First</span>
                    {recommendGapAnalysis && (
                      <Badge variant="green" className="font-normal">
                        Recommended
                      </Badge>
                    )}
                    <Badge variant="outline" className="font-normal">
                      Great for teams new to compliance
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Run a gap analysis before committing to an audit timeline. Identify missing pieces and prioritize what to fix first.</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      />
    </div>
  )
}
