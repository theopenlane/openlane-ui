import { Metadata } from 'next'
import { AuthLayout, type AuthLayoutProps } from '../../components/layouts/auth'

export const metadata: Metadata = {
  title: {
    template: '%s | Openlane | Streamlining Compliance, Securing Success',
    default: '',
  },
}

export default function Layout({ children }: AuthLayoutProps): React.ReactNode {
  return <AuthLayout>{children}</AuthLayout>
}
