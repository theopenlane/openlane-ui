import { VendorRiskScoreVendorRiskImpact, VendorRiskScoreVendorRiskLikelihood } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type TImportRecord } from '@/components/shared/record-import/lib/types'
import { serializeCsv } from '@/components/shared/record-import/lib/delimited-file'
import { toEnumToken } from '@/components/shared/record-import/lib/validate-cells'
import { exportToCSV, FORMULA_TRIGGER, guardCsvFormula } from '@/utils/exportToCSV'
import { formatList } from '@/utils/strings'
import { isOneOf } from '@/utils/type-guards'
import { ANSWER_TYPE_COPY } from '@/components/pages/protected/vendors/scoring/vendor-scoring-copy'
import { formatAnswer, hasAnswer, IMPACT_ORDER, isYesAnswer, LIKELIHOOD_ORDER, NO_RISK_LIKELIHOOD, parseAnswer, type TRiskQuestion } from './risk-answers'

const COLUMNS = ['Question Key', 'Category', 'Question', 'Why It Matters', 'Answer Type', 'Answer Options', 'Answer', 'Likelihood', 'Impact', 'Notes'] as const

type TCsvColumn = (typeof COLUMNS)[number]

const isLikelihood = isOneOf(Object.values(VendorRiskScoreVendorRiskLikelihood))
const isImpact = isOneOf(Object.values(VendorRiskScoreVendorRiskImpact))

const LIKELIHOOD_CHOICES = formatList(LIKELIHOOD_ORDER.map(getEnumLabel), 'disjunction')
const IMPACT_CHOICES = formatList(IMPACT_ORDER.map(getEnumLabel), 'disjunction')

const toCsvRow = ({ question, score }: TRiskQuestion): Record<TCsvColumn, string> => ({
  'Question Key': question.key,
  Category: getEnumLabel(question.category),
  Question: question.name,
  'Why It Matters': question.description ?? '',
  'Answer Type': ANSWER_TYPE_COPY[question.answerType].label,
  'Answer Options': (question.answerOptions ?? []).join(' | '),
  Answer: hasAnswer(score) ? formatAnswer(question, score?.answer) : '',
  Likelihood: score && hasAnswer(score) && !isYesAnswer(question, score.answer) ? getEnumLabel(score.likelihood) : '',
  Impact: getEnumLabel(score?.impact ?? question.suggestedImpact),
  Notes: score?.notes ?? '',
})

export const riskQuestionsCsv = (items: readonly TRiskQuestion[]) =>
  serializeCsv(
    [...COLUMNS],
    items.map(toCsvRow).map((row) => COLUMNS.map((column) => guardCsvFormula(row[column]))),
  )

export const downloadRiskQuestionsCsv = (items: readonly TRiskQuestion[], fileName: string) =>
  exportToCSV(
    items.map(toCsvRow),
    COLUMNS.map((label) => ({ label, accessor: (row: Record<TCsvColumn, string>) => row[label] })),
    fileName,
  )

type TRiskAnswerImportRow = {
  item: TRiskQuestion
  answer: string
  likelihood: VendorRiskScoreVendorRiskLikelihood
  impact: VendorRiskScoreVendorRiskImpact
  notes: string
}

type TRiskAnswerImportPlan = {
  creates: TRiskAnswerImportRow[]
  updates: (TRiskAnswerImportRow & { scoreId: string })[]
  errors: string[]
}

export type TRiskAnswerImportField = 'QuestionKey' | 'Answer' | 'Likelihood' | 'Impact' | 'Notes'

const readCell = (record: TImportRecord, field: TRiskAnswerImportField) => {
  const value = (record[field] ?? '').trim()
  return value.startsWith("'") && FORMULA_TRIGGER.test(value.slice(1)) ? value.slice(1) : value
}

export const planRiskAnswerImport = (records: readonly TImportRecord[], items: readonly TRiskQuestion[]): TRiskAnswerImportPlan => {
  const itemByKey = new Map(items.map((item) => [item.question.key.toUpperCase(), item]))
  const seenKeys = new Set<string>()
  const plan: TRiskAnswerImportPlan = { creates: [], updates: [], errors: [] }

  records.forEach((record, index) => {
    const line = index + 2
    const rawKey = readCell(record, 'QuestionKey')
    const key = rawKey.toUpperCase()
    const rawAnswer = readCell(record, 'Answer')
    if (!rawAnswer) return

    if (!key) return void plan.errors.push(`Row ${line}: add the question key for this answer.`)
    const item = itemByKey.get(key)
    if (!item) return void plan.errors.push(`Row ${line}: "${rawKey}" is not an active question.`)
    if (seenKeys.has(key)) return void plan.errors.push(`Row ${line}: ${item.question.key} appears more than once.`)
    seenKeys.add(key)

    const answer = parseAnswer(item, rawAnswer)
    if (typeof answer !== 'string') return void plan.errors.push(`Row ${line} (${item.question.key}): ${answer.error}.`)

    const likelihoodToken = toEnumToken(readCell(record, 'Likelihood'))
    const impactToken = toEnumToken(readCell(record, 'Impact'))
    if (!isYesAnswer(item.question, answer) && !isLikelihood(likelihoodToken)) {
      return void plan.errors.push(`Row ${line} (${item.question.key}): set a likelihood (${LIKELIHOOD_CHOICES}).`)
    }
    if (impactToken && !isImpact(impactToken)) {
      return void plan.errors.push(`Row ${line} (${item.question.key}): "${readCell(record, 'Impact')}" is not an impact (${IMPACT_CHOICES}).`)
    }

    const importRow: TRiskAnswerImportRow = {
      item,
      answer,
      likelihood: isLikelihood(likelihoodToken) ? likelihoodToken : (item.score?.likelihood ?? NO_RISK_LIKELIHOOD),
      impact: isImpact(impactToken) ? impactToken : (item.score?.impact ?? item.question.suggestedImpact),
      notes: readCell(record, 'Notes') || item.score?.notes || '',
    }
    if (item.score) plan.updates.push({ ...importRow, scoreId: item.score.id })
    else plan.creates.push(importRow)
  })

  return plan
}

export const toCreateCsv = (entityId: string, rows: readonly TRiskAnswerImportRow[]) => ({
  headers: ['EntityID', 'QuestionKey', 'QuestionName', 'QuestionCategory', 'Answer', 'Likelihood', 'Impact', 'Notes'],
  rows: rows.map(({ item, answer, likelihood, impact, notes }) => [entityId, item.question.key, item.question.name, item.question.category, answer, likelihood, impact, notes]),
})

export const toUpdateCsv = (rows: TRiskAnswerImportPlan['updates']) => ({
  headers: ['ID', 'Answer', 'Likelihood', 'Impact', 'Notes'],
  rows: rows.map(({ scoreId, answer, likelihood, impact, notes }) => [scoreId, answer, likelihood, impact, notes]),
})
