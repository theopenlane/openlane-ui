'use client'

import ErrorPage from '@/components/shared/error/error-page'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'

type TrustCenterProps = {
  children: React.ReactNode
}

const TrustCenter = ({ children }: TrustCenterProps) => {
  const { data } = useGetTrustCenter()
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  if (!trustCenter) {
    return (
      <ErrorPage title="We ran into an unexpected issue while loading this page. Your access hasn't changed, and no action is required on your end. Please try again in a few moments. If the issue persists, contact support." />
    )
  }
  return <>{children}</>
}

export default TrustCenter
