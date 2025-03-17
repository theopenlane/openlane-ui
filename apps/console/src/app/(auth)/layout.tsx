import { AuthLayout, type AuthLayoutProps } from '../../components/layouts/auth'

export default function Layout({ children }: AuthLayoutProps): React.ReactNode {
  return <AuthLayout>{children}</AuthLayout>
}
