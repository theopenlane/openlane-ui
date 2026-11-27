'use client'

import { useSession } from 'next-auth/react'
import { Callout } from '@/components/shared/callout/callout'
import { Link } from '@/components/shared/link/link'
import { BILLING_PAYMENT_METHOD_DOCS_URL } from '@/constants/docs'
import { canManageBilling } from '@/lib/authz/utils'
import { useCurrentUserRole } from '@/lib/graphql-hooks/member'

type TPaymentMethodCalloutProps = {
  isEditMode: boolean
}

export const PaymentMethodCallout = ({ isEditMode }: TPaymentMethodCalloutProps) => {
  const { data: session } = useSession()
  const { role, isLoading } = useCurrentUserRole()
  const canAddPaymentMethod = !isLoading && canManageBilling(role, session)

  return (
    <Callout variant="warning" title="Payment method required" className="mb-4" compact role="alert">
      <p>
        Your organization needs a payment method on file before you can {isEditMode ? 'update' : 'create'} tokens.{' '}
        {canAddPaymentMethod ? (
          <>
            Add one in{' '}
            <Link href="/organization-settings/billing" newTab>
              billing settings
            </Link>
            .
          </>
        ) : (
          'Contact your organization owner to add one in billing settings.'
        )}
      </p>
      <p className="mt-1">
        Learn more in the{' '}
        <Link href={BILLING_PAYMENT_METHOD_DOCS_URL} newTab>
          documentation
        </Link>
        .
      </p>
    </Callout>
  )
}
