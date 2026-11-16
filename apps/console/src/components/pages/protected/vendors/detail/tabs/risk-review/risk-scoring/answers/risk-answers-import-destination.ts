import { staticImportDestination } from '@/components/shared/record-import/lib/destination-fields'
import type { TDestinationField, TImportDestination } from '@/components/shared/record-import/lib/types'
import { DEFAULT_VENDOR_SCORING_QUESTIONS } from '@repo/codegen/src/vendor-scoring-defaults.generated'
import { riskQuestionsCsv, type TRiskAnswerImportField } from './risk-answers-csv'
import { IMPACT_ORDER, LIKELIHOOD_ORDER, type TRiskQuestion } from './risk-answers'

const RISK_ANSWER_IMPORT_FIELDS = {
  QuestionKey: {
    label: 'Question Key',
    description: 'The key of the scoring question, as in the downloaded questions CSV',
    example: DEFAULT_VENDOR_SCORING_QUESTIONS[0]?.key,
    aliases: ['key', 'question id'],
  },
  Answer: { label: 'Answer', description: 'Yes or No, a number, one of the listed options, or free text. Rows without an answer are skipped', example: 'Yes' },
  Likelihood: { label: 'Likelihood', description: 'Required unless the answer is Yes', example: 'Low', meta: { kind: 'enum', enumValues: LIKELIHOOD_ORDER } },
  Impact: { label: 'Impact', description: "Defaults to the question's default impact", example: 'High', meta: { kind: 'enum', enumValues: IMPACT_ORDER } },
  Notes: { label: 'Notes', description: 'Notes for this answer. A blank cell keeps the current note', example: 'Confirmed in the SOC 2 report.' },
} as const satisfies Record<TRiskAnswerImportField, Omit<TDestinationField, 'name' | 'fuzzyMatchable'>>

const fields: TDestinationField[] = Object.entries(RISK_ANSWER_IMPORT_FIELDS).map(([name, details]) => ({ name, fuzzyMatchable: true, ...details }))

const RISK_ANSWERS_IMPORT_DESTINATION: TImportDestination = staticImportDestination({ fields, primaryField: 'QuestionKey' }, 'vendor-risk-answers')

export const riskAnswersImportDestination = (items: readonly TRiskQuestion[]): TImportDestination =>
  items.length > 0 ? { ...RISK_ANSWERS_IMPORT_DESTINATION, exampleCsv: riskQuestionsCsv(items) } : RISK_ANSWERS_IMPORT_DESTINATION
