import type { Metadata } from 'next'
import { GET_STANDARD_BY_ID_MINIFIED } from '@repo/codegen/query/standard'
import type { GetStandardByIdMinifiedQuery, GetStandardByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetStandardByIdMinifiedQueryVariables, GetStandardByIdMinifiedQuery>({
    query: GET_STANDARD_BY_ID_MINIFIED,
    variables: { standardId: id },
    prefix: 'Standards',
    selectLabel: (data) => data.standard?.shortName ?? data.standard?.name,
  })
}

const StandardIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default StandardIdLayout
