'use client'

import Diamond from '@/assets/Diamond'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { featureUtil } from '@/lib/subscription-plan/plans.ts'
import { useOpenlaneProductsQuery } from '@/lib/query-hooks/stripe.ts'

type TRequiredSubscriptionProps = {
  module: PlanEnum
}

const RequiredSubscription: React.FC<TRequiredSubscriptionProps> = ({ module }: TRequiredSubscriptionProps) => {
  const router = useRouter()
  const { data: openlaneProducts } = useOpenlaneProductsQuery(true)
  const moduleDescription = featureUtil.getPlanDescription(module, openlaneProducts)
  const moduleName = featureUtil.getPlanName(module)

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-8">
      <div className="mb-2">
        <Diamond />
      </div>
      <h1 className="text-3xl font-normal text-foreground max-w-[607px] leading-relaxed">Unlock the full potential! It seems you&apos;ve landed on a page that&apos;s part of {moduleName} module</h1>
      <p className="text-base text-muted-foreground mb-2 max-w-md">{moduleDescription}</p>
      <Button onClick={() => router.push('/organization-settings/billing')} className="px-6 py-2 rounded-md font-medium btn-secondary">
        Get Access to {moduleName} module
      </Button>
    </div>
  )
}

export default RequiredSubscription
