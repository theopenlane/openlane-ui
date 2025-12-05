'use client'
import React from 'react'
import { Rocket, SearchCheck } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { useFormContext, Controller } from 'react-hook-form'

export default function StartTypeStep() {
  const { control, watch } = useFormContext<{ programKindName?: string }>()
  const selected = watch('programKindName')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">How do you want to get started?</h2>
        <p className="text-sm text-muted-foreground">Choose the path that best matches your current readiness. You can switch later if your needs change.</p>
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
              className={`flex flex-1 items-center gap-3 rounded-xl p-4 hover:border-primary transition cursor-pointer ${selected === 'Gap Analysis' ? 'border-primary' : 'border-border'}`}
              onClick={() => field.onChange('Gap Analysis')}
            >
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded-md bg-secondary border shrink-0">
                  <SearchCheck className="text-primary" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex gap-2 items-center">
                    <span className="font-medium">Gap Analysis First</span>
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
