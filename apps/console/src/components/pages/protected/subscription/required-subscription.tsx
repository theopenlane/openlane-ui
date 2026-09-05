'use client'

import Diamond from '@/assets/Diamond'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum.ts'
import { featureUtil } from '@/lib/subscription-plan/plans.ts'
import { useOpenlaneProductsQuery } from '@/lib/query-hooks/stripe.ts'

type TRequiredSubscriptionProps = {
  module: PlanEnum | PlanEnum[]
}

const RequiredSubscription: React.FC<TRequiredSubscriptionProps> = ({ module }: TRequiredSubscriptionProps) => {
  const router = useRouter()
  const { data: openlaneProducts } = useOpenlaneProductsQuery(true)
  const modules = featureUtil.toModules(module)
  const moduleLabel = modules.map((m) => featureUtil.getPlanName(m)).join(' or ')
  const moduleNoun = modules.length > 1 ? 'modules' : 'module'
  const moduleDescription = modules.length > 0 ? featureUtil.getPlanDescription(modules[0], openlaneProducts) : undefined

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-8">
      <div className="mb-2">
        <Diamond />
      </div>
      <h1 className="text-3xl font-normal text-foreground max-w-[607px] leading-relaxed">
        Unlock the full potential! It seems you&apos;ve landed on a page that&apos;s part of the {moduleLabel} {moduleNoun}
      </h1>
      {moduleDescription && <p className="text-base text-muted-foreground mb-2 max-w-md">{moduleDescription}</p>}
      <Button variant="secondary" onClick={() => router.push('/organization-settings/billing')} className="px-6 py-2 rounded-md font-medium">
        Get Access to {moduleLabel} {moduleNoun}
      </Button>
    </div>
  )
}

export default RequiredSubscription
