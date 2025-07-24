import RequiredSubscription from '@/components/pages/protected/subscription-test/required-subscription'
import { NextPage } from 'next'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscription required',
}

const Page: NextPage = () => <RequiredSubscription />

export default Page
