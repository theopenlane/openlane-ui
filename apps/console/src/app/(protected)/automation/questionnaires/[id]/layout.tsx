import type { Metadata } from 'next'
import { GET_ASSESSMENT_BY_ID_MINIFIED } from '@repo/codegen/query/assessment'
import type { GetAssessmentByIdMinifiedQuery, GetAssessmentByIdMinifiedQueryVariables } from '@repo/codegen/src/schema'
import { buildDetailMetadata } from '@/lib/server/build-detail-metadata'

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> => {
  const { id } = await params
  return buildDetailMetadata<GetAssessmentByIdMinifiedQueryVariables, GetAssessmentByIdMinifiedQuery>({
    query: GET_ASSESSMENT_BY_ID_MINIFIED,
    variables: { getAssessmentId: id },
    prefix: 'Questionnaire',
    selectLabel: (data) => data.assessment?.name,
  })
}

const QuestionnaireIdLayout = ({ children }: { children: React.ReactNode }) => <>{children}</>

export default QuestionnaireIdLayout
