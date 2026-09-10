import { type Metadata } from 'next'
import { AuthLayout, type AuthLayoutProps } from '../../components/layouts/auth'
import HubspotTracking from '@/components/shared/hubspot/hubspot-tracking'

export const metadata: Metadata = {
  title: {
    template: '%s | Openlane | Streamlining Compliance, Securing Success',
    default: '',
  },
}

export default function Layout({ children }: AuthLayoutProps): React.ReactNode {
  return (
    <>
      <HubspotTracking />
      <AuthLayout>{children}</AuthLayout>
    </>
  )
}
