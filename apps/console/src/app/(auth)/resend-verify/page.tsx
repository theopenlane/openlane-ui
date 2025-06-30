import { Resend } from '@/components/pages/auth/resend-verify/resend'
import { pageStyles } from './page.styles'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resend Email Verification',
}

const ResendVerification: React.FC = () => {
  const { content, form } = pageStyles()
  return (
    <main className={content()}>
      <div className={form()}>
        <Resend />
      </div>
    </main>
  )
}

export default ResendVerification
