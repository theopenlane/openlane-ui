import type { Metadata } from 'next'
import { GET_PLATFORM_BY_ID_MINIFIED } from '@repo/codegen/query/platform'
import type { GetPlatformByIdMinifiedQuery, GetPlatformByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetPlatformByIdMinifiedQueryVariables, GetPlatformByIdMinifiedQuery>({
    query: GET_PLATFORM_BY_ID_MINIFIED,
    variables: { platformId: id },
    prefix: 'Platform',
    selectLabel: (data) => data.platform?.name ?? data.platform?.displayID,
  })
}

const PlatformIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default PlatformIdLayout
