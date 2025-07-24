'use client'

import Diamond from '@/assets/Diamond'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'

type TRequiredSubscriptionProps = {
  module?: string
  moduleDescription?: string
}

const RequiredSubscription = ({ module = 'Security', moduleDescription = 'This module offers in-depth security measures. Ready to dive deeper?' }: TRequiredSubscriptionProps) => {
  const router = useRouter()
  return (
    <div className="pt-[154px] flex flex-col items-center justify-center gap-4">
      <div className="mb-5">
        <Diamond />
      </div>
      <p className="text-3xl text-center break-words leading-9 w-[607px]">{`Unlock the full potential! It seems you've landed on a page that's part of ${module} module`}</p>
      <p className="text-base mb-6">{moduleDescription}</p>
      <Button onClick={() => router.push('/organization-settings/billing')}>{`Get Access to ${module} module`}</Button>
    </div>
  )
}

export default RequiredSubscription
