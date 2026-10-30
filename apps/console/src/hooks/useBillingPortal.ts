import { useState } from 'react'
import { useBillingPortalMutation } from '@/lib/query-hooks/stripe'
import { useNotification } from './useNotification'

export const useOpenBillingPortal = () => {
  const { errorNotification } = useNotification()
  const { mutateAsync: createPortalSession } = useBillingPortalMutation()
  const [redirecting, setRedirecting] = useState(false)

  const openBillingPortal = async (fullPortal = false) => {
    setRedirecting(true)
    try {
      window.location.href = await createPortalSession({ fullPortal })
    } catch (err) {
      setRedirecting(false)
      errorNotification({
        title: 'Could not open the billing portal',
        description: err instanceof Error ? err.message : 'Please try again or reach out to support.',
      })
    }
  }

  return { openBillingPortal, redirecting }
}
