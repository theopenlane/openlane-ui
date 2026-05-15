import type { Metadata } from 'next'
import { GET_PROCEDURE_BY_ID_MINIFIED } from '@repo/codegen/query/procedure'
import type { GetProcedureByIdMinifiedQuery, GetProcedureByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetProcedureByIdMinifiedQueryVariables, GetProcedureByIdMinifiedQuery>({
    query: GET_PROCEDURE_BY_ID_MINIFIED,
    variables: { procedureId: id },
    prefix: 'Procedure',
    selectLabel: (data) => data.procedure?.name,
  })
}

const ProcedureIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default ProcedureIdLayout
