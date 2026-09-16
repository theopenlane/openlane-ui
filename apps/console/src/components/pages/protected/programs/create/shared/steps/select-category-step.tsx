'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Callout } from '@/components/shared/callout/callout'
import { TrustServicesCategoryOption } from '@/components/shared/trust-services-categories/trust-services-category-option'
import { SOC_2_FRAMEWORK_NAME, SOC_2_REQUIRED_CATEGORY, TRUST_SERVICES_CATEGORIES } from '@/constants/trust-services-categories'

const SelectCategoryStep = () => {
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
        <h2 className="text-lg font-semibold">Add Trust Services Categories</h2>
        {isOnboardingFlow && (
          <Callout variant="recommendation" title="Recommendation" className="mt-6">
            Security is required for SOC 2 and has already been selected. For your first audit, we recommend starting with Security. Add <b>Availability</b> if uptime and service resilience are
            important customer commitments.
          </Callout>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-5">Select the categories you want to include in this program</p>

      <div className="flex flex-col gap-3 mt-3">
        {TRUST_SERVICES_CATEGORIES.map((category) => (
          <TrustServicesCategoryOption
            key={category.name}
            category={category}
            checked={selected.includes(category.name)}
            onCheckedChange={() => toggleCategory(category.name)}
            requiredLabel={category.name === SOC_2_REQUIRED_CATEGORY ? `Required for ${SOC_2_FRAMEWORK_NAME}` : undefined}
          />
        ))}
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

export default SelectCategoryStep
