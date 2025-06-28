import { Metadata } from 'next'
import Waitlist from '@/components/pages/auth/waitlist/waitlist'

export const metadata: Metadata = {
  title: 'Openlane Waitlist | Secure Your Spot',
}

const WaitlistPage: React.FC = () => <Waitlist />

export default WaitlistPage
