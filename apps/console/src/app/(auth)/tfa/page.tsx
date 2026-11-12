import { cookies } from 'next/headers'
import { isTfaEnrollmentToken } from '@/lib/auth/utils/token-claims'
import Tfa from '@/components/pages/auth/tfa/tfa'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Two Factor Authentication',
}

const TfaPage = async () => <Tfa enrollment={isTfaEnrollmentToken((await cookies()).get('access_token')?.value)} />

export default TfaPage
