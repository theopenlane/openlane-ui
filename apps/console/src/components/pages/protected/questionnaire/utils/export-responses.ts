import { exportToCSV } from '@/utils/exportToCSV'
import { isRecord } from '@/utils/type-guards'
import { extractQuestions } from '../responses-tab/extract-questions'
import { renderAnswer } from './render-answer'

export type TExportableResponse = {
  email?: string | null
  displayName?: string | null
  completedAt?: string | null
  identityHolder?: { fullName: string } | null
  document?: { data: unknown } | null
}

const answerOf = (response: TExportableResponse, questionName: string) => {
  const data = response.document?.data
  return isRecord(data) ? data[questionName] : undefined
}

export const exportResponsesToCsv = (responses: TExportableResponse[], jsonconfig: unknown, fileName: string) => {
  const questions = extractQuestions(jsonconfig)
  exportToCSV(
    responses,
    [
      { label: 'Respondent', accessor: (response) => response.email || response.displayName || '' },
      { label: 'Name', accessor: (response) => response.identityHolder?.fullName ?? '' },
      { label: 'Completed', accessor: (response) => response.completedAt || '' },
      ...questions.map((question) => ({ label: question.title, accessor: (response: TExportableResponse) => renderAnswer(answerOf(response, question.name), question.type) })),
    ],
    fileName,
  )
}
