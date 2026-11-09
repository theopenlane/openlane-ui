import { VendorRiskScoreVendorRiskImpact, VendorRiskScoreVendorRiskLikelihood, VendorRiskScoreVendorScoringAnswerType } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type TDelimitedGrid } from '@/components/shared/record-import/lib/delimited-file'
import { toEnumToken } from '@/components/shared/record-import/lib/validate-cells'
import { exportToCSV, FORMULA_TRIGGER } from '@/utils/exportToCSV'
import { formatList, normalizeFieldName } from '@/utils/strings'
import { isOneOf } from '@/utils/type-guards'
import { ANSWER_TYPE_COPY } from '@/components/pages/protected/vendors/scoring/vendor-scoring-copy'
import { BOOLEAN_ANSWER, formatAnswer, hasAnswer, IMPACT_ORDER, isYesAnswer, LIKELIHOOD_ORDER, NO_RISK_LIKELIHOOD, type TRiskQuestion } from './risk-answers'

const COLUMNS = ['Question Key', 'Category', 'Question', 'Why It Matters', 'Answer Type', 'Answer Options', 'Answer', 'Likelihood', 'Impact', 'Notes'] as const

type TCsvColumn = (typeof COLUMNS)[number]

const isLikelihood = isOneOf(Object.values(VendorRiskScoreVendorRiskLikelihood))
const isImpact = isOneOf(Object.values(VendorRiskScoreVendorRiskImpact))

const LIKELIHOOD_CHOICES = formatList(LIKELIHOOD_ORDER.map(getEnumLabel), 'disjunction')
const IMPACT_CHOICES = formatList(IMPACT_ORDER.map(getEnumLabel), 'disjunction')

const BOOLEAN_TOKENS: Record<string, string> = { YES: BOOLEAN_ANSWER.YES, TRUE: BOOLEAN_ANSWER.YES, Y: BOOLEAN_ANSWER.YES, NO: BOOLEAN_ANSWER.NO, FALSE: BOOLEAN_ANSWER.NO, N: BOOLEAN_ANSWER.NO }

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

export const downloadRiskQuestionsCsv = (items: readonly TRiskQuestion[], fileName: string) =>
  exportToCSV(
    items.map(toCsvRow),
    COLUMNS.map((label) => ({ label, accessor: (row: Record<TCsvColumn, string>) => row[label] })),
    fileName,
  )

export type TRiskAnswerImportRow = {
  item: TRiskQuestion
  answer: string
  likelihood: VendorRiskScoreVendorRiskLikelihood
  impact: VendorRiskScoreVendorRiskImpact
  notes: string
}

export type TRiskAnswerImportPlan = {
  creates: TRiskAnswerImportRow[]
  updates: (TRiskAnswerImportRow & { scoreId: string })[]
  skippedCount: number
  errors: string[]
}

const emptyPlan = (errors: string[] = []): TRiskAnswerImportPlan => ({ creates: [], updates: [], skippedCount: 0, errors })

const parseAnswer = ({ question }: TRiskQuestion, raw: string): string | { error: string } => {
  const value = raw.trim()
  switch (question.answerType) {
    case VendorRiskScoreVendorScoringAnswerType.BOOLEAN:
      return BOOLEAN_TOKENS[toEnumToken(value)] ?? { error: `"${value}" is not Yes or No` }
    case VendorRiskScoreVendorScoringAnswerType.NUMERIC:
      return Number.isFinite(Number(value)) ? value : { error: `"${value}" is not a number` }
    case VendorRiskScoreVendorScoringAnswerType.SINGLE_SELECT: {
      const options = question.answerOptions ?? []
      return options.find((option) => option.trim().toLowerCase() === value.toLowerCase()) ?? { error: `"${value}" is not one of ${formatList(options, 'disjunction')}` }
    }
    default:
      return value
  }
}

export const planRiskAnswerImport = (grid: TDelimitedGrid, items: readonly TRiskQuestion[]): TRiskAnswerImportPlan => {
  if (grid.malformed) {
    return emptyPlan([`${grid.raggedRowCount || 'Some'} rows have a different number of columns than the header, usually from an unquoted comma. Fix them and upload again.`])
  }

  const columnIndex = new Map(grid.headers.map((header, index) => [normalizeFieldName(header), index]))
  if (!columnIndex.has(normalizeFieldName('Question Key')) || !columnIndex.has(normalizeFieldName('Answer'))) {
    return emptyPlan(['The file needs a "Question Key" and an "Answer" column. Download the questions CSV to get the right layout.'])
  }

  const cell = (row: string[], column: TCsvColumn) => {
    const index = columnIndex.get(normalizeFieldName(column))
    const value = index === undefined ? '' : (row[index] ?? '').trim()
    return value.startsWith("'") && FORMULA_TRIGGER.test(value.slice(1)) ? value.slice(1) : value
  }

  const itemByKey = new Map(items.map((item) => [item.question.key.toUpperCase(), item]))
  const seenKeys = new Set<string>()
  const plan = emptyPlan()

  grid.rows.forEach((row, index) => {
    const line = index + 2
    const key = cell(row, 'Question Key').toUpperCase()
    const rawAnswer = cell(row, 'Answer')
    if (!key && !rawAnswer) return
    if (!rawAnswer) {
      plan.skippedCount += 1
      return
    }

    const item = itemByKey.get(key)
    if (!item) return void plan.errors.push(`Row ${line}: "${cell(row, 'Question Key')}" is not an active question.`)
    if (seenKeys.has(key)) return void plan.errors.push(`Row ${line}: ${item.question.key} appears more than once.`)
    seenKeys.add(key)

    const answer = parseAnswer(item, rawAnswer)
    if (typeof answer !== 'string') return void plan.errors.push(`Row ${line} (${item.question.key}): ${answer.error}.`)

    const likelihoodToken = toEnumToken(cell(row, 'Likelihood'))
    const impactToken = toEnumToken(cell(row, 'Impact'))
    if (!isYesAnswer(item.question, answer) && !isLikelihood(likelihoodToken)) {
      return void plan.errors.push(`Row ${line} (${item.question.key}): set a likelihood (${LIKELIHOOD_CHOICES}).`)
    }
    if (impactToken && !isImpact(impactToken)) {
      return void plan.errors.push(`Row ${line} (${item.question.key}): "${cell(row, 'Impact')}" is not an impact (${IMPACT_CHOICES}).`)
    }

    const importRow: TRiskAnswerImportRow = {
      item,
      answer,
      likelihood: isLikelihood(likelihoodToken) ? likelihoodToken : (item.score?.likelihood ?? NO_RISK_LIKELIHOOD),
      impact: isImpact(impactToken) ? impactToken : (item.score?.impact ?? item.question.suggestedImpact),
      notes: cell(row, 'Notes') || item.score?.notes || '',
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
