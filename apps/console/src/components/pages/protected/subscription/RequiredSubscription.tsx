'use client'

import Diamond from '@/assets/Diamond'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { featureUtil } from '@/lib/subscription-plan/plans.ts'

type TRequiredSubscriptionProps = {
  module: PlanEnum
}

const RequiredSubscription: React.FC<TRequiredSubscriptionProps> = ({ module }: TRequiredSubscriptionProps) => {
  const router = useRouter()
  const moduleDescription = featureUtil.getPlanDescription(module)

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-8">
      <div className="mb-2">
        <Diamond />
      </div>
      <h1 className="text-3xl font-normal text-foreground max-w-[607px] leading-relaxed">Unlock the full potential! It seems you&apos;ve landed on a page that&apos;s part of {module} module</h1>
      <p className="text-base text-muted-foreground mb-2 max-w-md">{moduleDescription}</p>
      <Button onClick={() => router.push('/organization-settings/billing')} className="px-6 py-2 rounded-md font-medium">
        Get Access to {module} module
      </Button>
    </div>
  )
}

export default RequiredSubscription
