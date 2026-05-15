import type { Metadata } from 'next'
import { GET_INTERNAL_POLICY_BY_ID_MINIFIED } from '@repo/codegen/query/internal-policy'
import type { GetInternalPolicyByIdMinifiedQuery, GetInternalPolicyByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetInternalPolicyByIdMinifiedQueryVariables, GetInternalPolicyByIdMinifiedQuery>({
    query: GET_INTERNAL_POLICY_BY_ID_MINIFIED,
    variables: { internalPolicyId: id },
    prefix: 'Policy',
    selectLabel: (data) => data.internalPolicy?.name,
  })
}

const PolicyIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default PolicyIdLayout
