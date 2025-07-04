import ForgotPasswordComponent from '@/components/pages/auth/forgot-password/forgot-password'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password',
}

const ForgotPasswordPage: React.FC = () => <ForgotPasswordComponent />

export default ForgotPasswordPage
