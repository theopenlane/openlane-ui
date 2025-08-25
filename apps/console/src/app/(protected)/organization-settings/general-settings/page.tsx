import type { Metadata } from 'next/types'
import { PageWrapper } from './page-wrapper'

export const metadata: Metadata = {
  title: 'Organization Settings',
}

const Page: React.FC = () => {
  return <PageWrapper />
}

export default Page
