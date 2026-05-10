import type { Metadata } from 'next/types'
import { GraphQLExplorerPage } from '@/components/pages/protected/developers/graphql-explorer-page'

export const metadata: Metadata = {
  title: 'Developers | GraphQL Explorer',
}

const Page: React.FC = () => {
  return <GraphQLExplorerPage />
}

export default Page
