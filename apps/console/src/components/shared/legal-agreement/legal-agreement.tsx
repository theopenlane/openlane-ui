'use client'

import Link from 'next/link'
import { cn } from '@repo/ui/lib/utils'
import { OPENLANE_WEBSITE_URL } from '@/constants'
import OfficialOnly from '@/components/shared/official-only/official-only'

const linkClassName = 'text-xs underline hover:text-blue-500 hover:opacity-80 transition-colors duration-500'

type LegalAgreementProps = {
  action: 'signing in' | 'signing up'
  className?: string
}

const LegalAgreement = ({ action, className }: LegalAgreementProps) => (
  <OfficialOnly>
    <div className={cn('text-xs opacity-90 flex gap-1 text-muted-foreground', className)}>
      By {action}, you agree to our
      <Link href={`${OPENLANE_WEBSITE_URL}/legal/terms-of-service`} className={linkClassName}>
        Terms of Service
      </Link>{' '}
      and
      <Link href={`${OPENLANE_WEBSITE_URL}/legal/privacy`} className={linkClassName}>
        Privacy Policy
      </Link>
    </div>
  </OfficialOnly>
)

export default LegalAgreement
