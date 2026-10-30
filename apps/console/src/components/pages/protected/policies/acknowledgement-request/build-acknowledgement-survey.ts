import { ACKNOWLEDGEMENT_QUESTION_TYPE, toPdfDocumentQuestionJson, type TPdfDocumentAttachment } from '@theopenlane/surveyjs-components'

type TAcknowledgementSurveyInput = {
  title: string
  statement: string
  documents: TPdfDocumentAttachment[]
}

const questionName = (index: number) => `question${index + 1}`

export const buildAcknowledgementSurvey = ({ title, statement, documents }: TAcknowledgementSurveyInput) => {
  const documentQuestions = documents.map((document, index) => toPdfDocumentQuestionJson(questionName(index), document))

  const acknowledgement = {
    type: ACKNOWLEDGEMENT_QUESTION_TYPE,
    name: questionName(documents.length),
    statement,
    enableIf: documentQuestions.map(({ name }) => `{${name}} = true`).join(' and '),
  }

  return { title, pages: [{ name: 'page1', elements: [...documentQuestions, acknowledgement] }] }
}
