import type { Metadata } from 'next'
import { GET_SUBCONTROL_BY_ID_MINIFIED } from '@repo/codegen/query/subcontrol'
import type { GetSubcontrolByIdMinifiedQuery, GetSubcontrolByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ subcontrolId: string }> }): Promise<Metadata> => {
  const { subcontrolId } = await params
  return buildDetailMetadata<GetSubcontrolByIdMinifiedQueryVariables, GetSubcontrolByIdMinifiedQuery>({
    query: GET_SUBCONTROL_BY_ID_MINIFIED,
    variables: { subcontrolId },
    prefix: 'Subcontrols',
    selectLabel: (data) => data.subcontrol?.refCode,
  })
}

const SubcontrolIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default SubcontrolIdLayout
