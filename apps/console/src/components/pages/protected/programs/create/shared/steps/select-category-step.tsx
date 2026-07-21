'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@repo/ui/badge'
import { cn } from '@repo/ui/lib/utils'
import { AlertCircle, BookLock, Check, Cloud, GlobeLock, Shield, SlidersHorizontal } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'

const CATEGORY_OPTIONS = [
  { name: 'Security', icon: Shield },
  { name: 'Availability', icon: Cloud },
  { name: 'Confidentiality', icon: BookLock },
  { name: 'Processing Integrity', icon: SlidersHorizontal },
  { name: 'Privacy', icon: GlobeLock },
]

export default function SelectCategoryStep() {
  const { watch, setValue } = useFormContext<{ categories: string[] }>()
  const searchParams = useSearchParams()
  const isOnboardingFlow = searchParams.get('onboarding') === 'true'

  const selected = watch('categories') || []

  const toggleCategory = (cat: string) => {
    if (selected.includes(cat)) {
      setValue(
        'categories',
        selected.filter((c) => c !== cat),
      )
    } else {
      setValue('categories', [...selected, cat])
    }
  }

  const showWarning = selected.length === 0

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Add Trust Service Categories</h2>
        {isOnboardingFlow && (
          <Callout variant="recommendation" title="Recommendation" className="mt-6">
            Security is required for SOC 2 and has already been selected. For your first audit, we recommend starting with Security. Add <b>Availability</b> if uptime and service resilience are
            important customer commitments.
          </Callout>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-5">Select the categories you want to include in this program</p>

      <div className="flex flex-col gap-3 mt-3">
        {CATEGORY_OPTIONS.map(({ name, icon: Icon }) => {
          const isSelected = selected.includes(name)

          return (
            <div
              key={name}
              role="button"
              tabIndex={0}
              onClick={() => toggleCategory(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleCategory(name)
                }
              }}
              className={`flex items-center gap-3 p-4 rounded-md border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-btn-secondary',
                )}
              >
                {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
              </div>
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">{name}</span>
              {name === 'Security' && (
                <Badge variant="outline" className="border-primary/40 bg-primary/15 text-primary">
                  Required for SOC 2
                </Badge>
              )}
            </div>
          )
        })}
      </div>

      {showWarning && (
        <div className="mt-5 flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <p>No categories selected — no controls will be imported.</p>
        </div>
      )}
    </>
  )
}
