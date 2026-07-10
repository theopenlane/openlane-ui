import type { Metadata } from 'next'
import { GET_CONTROL_BY_ID_MINIFIED } from '@repo/codegen/query/control'
import type { GetControlByIdMinifiedQuery, GetControlByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetControlByIdMinifiedQueryVariables, GetControlByIdMinifiedQuery>({
    query: GET_CONTROL_BY_ID_MINIFIED,
    variables: { controlId: id },
    prefix: 'Controls',
    selectLabel: (data) => data.control?.refCode,
  })
}

const ControlIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default ControlIdLayout
