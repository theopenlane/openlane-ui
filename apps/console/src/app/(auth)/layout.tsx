import { AuthLayout, type AuthLayoutProps } from '../../components/layouts/auth'

export default function Layout({ children }: AuthLayoutProps): JSX.Element {
  return <AuthLayout>{children}</AuthLayout>
}
