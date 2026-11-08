const fs = require('fs')
const path = require('path')

const CORE_COMMON_SOURCE = process.env.CORE_COMMON_SOURCE || 'https://raw.githubusercontent.com/theopenlane/core/main/common'

const srcDir = path.join(__dirname, '..', 'src')
const schemaTypesPath = path.join(srcDir, 'schema-types.ts')
const outputPath = path.join(srcDir, 'vendor-scoring-defaults.generated.ts')

const SOURCES = {
  models: 'models/vendorscoring.go',
  category: 'enums/vendorscoringcategory.go',
  answerType: 'enums/vendorscoringanswertype.go',
  impact: 'enums/vendorriskimpact.go',
  rating: 'enums/vendorriskrating.go',
}

const QUESTION_JSON_TAGS = {
  Key: 'key',
  Name: 'name',
  Description: 'description,omitempty',
  Category: 'category',
  AnswerType: 'answerType',
  AnswerOptions: 'answerOptions,omitempty',
  SuggestedImpact: 'suggestedImpact',
  Enabled: 'enabled',
}

const THRESHOLD_JSON_TAGS = { Rating: 'rating', MaxScore: 'maxScore' }

const CODEGEN_ENUMS = {
  category: 'VendorRiskScoreVendorScoringCategory',
  answerType: 'VendorRiskScoreVendorScoringAnswerType',
  impact: 'VendorRiskScoreVendorRiskImpact',
}

const INVALID_ENUM_VALUE = 'INVALID'

const FETCH_TIMEOUT_MS = 30 * 1000 // 30s

const readSource = async (relativePath) => {
  if (!/^https?:\/\//.test(CORE_COMMON_SOURCE)) {
    return fs.readFileSync(path.resolve(CORE_COMMON_SOURCE, relativePath), 'utf8')
  }

  const url = `${CORE_COMMON_SOURCE}/${relativePath}`
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

const skipLiteral = (source, i) => {
  const quote = source[i]
  if (quote === '/' && source[i + 1] === '/') {
    const end = source.indexOf('\n', i)
    return end === -1 ? source.length : end
  }
  if (quote !== '"' && quote !== '`' && quote !== "'") return i
  for (let j = i + 1; j < source.length; j++) {
    if (source[j] === '\\' && quote !== '`') j++
    else if (source[j] === quote) return j
  }
  throw new Error('unterminated string literal in core source')
}

const scanBraces = (source, from, onBrace) => {
  let depth = 0
  for (let i = from; i < source.length; i++) {
    const skipped = skipLiteral(source, i)
    if (skipped !== i) {
      i = skipped
      continue
    }
    if (source[i] !== '{' && source[i] !== '}') continue
    depth += source[i] === '{' ? 1 : -1
    if (onBrace(depth, i) === false) return
  }
  if (depth !== 0) throw new Error('unbalanced braces in core source')
}

const extractBlock = (source, opener, label) => {
  const start = source.indexOf(opener)
  if (start === -1) {
    throw new Error(`could not find ${label} (${opener}) in core source`)
  }

  let end = -1
  scanBraces(source, start + opener.length - 1, (depth, i) => {
    if (depth !== 0) return true
    end = i
    return false
  })
  if (end === -1) throw new Error(`unterminated ${label} block in core source`)
  return source.slice(start + opener.length, end)
}

const assertJsonTags = (source, structName, expected) => {
  const body = extractBlock(source, `type ${structName} struct {`, `struct ${structName}`)
  const fields = [...body.matchAll(/^\s*([A-Z]\w*)\s+\S[^\n]*$/gm)].map(([, field]) => field)
  const unexpected = fields.filter((field) => !(field in expected))
  if (unexpected.length > 0) {
    throw new Error(`${structName} has fields this generator does not know (${unexpected.join(', ')}); update generate-vendor-scoring-defaults.js and the emitted types`)
  }
  Object.entries(expected).forEach(([field, tag]) => {
    if (!new RegExp(`^\\s*${field}\\s+[^\\n]*\`[^\`]*json:"${tag}"[^\`]*\``, 'm').test(body)) {
      throw new Error(`${structName}.${field} no longer has json tag "${tag}"; update generate-vendor-scoring-defaults.js and the emitted types`)
    }
  })
}

const parseGoEnum = (source, goType) => {
  const values = new Map()
  for (const [, constant, value] of source.matchAll(new RegExp(`^\\s*(${goType}\\w+)\\s+${goType}\\s*=\\s*"([^"]+)"`, 'gm'))) {
    if (value !== INVALID_ENUM_VALUE) values.set(constant, value)
  }
  if (values.size === 0) {
    throw new Error(`no values found for Go enum ${goType}`)
  }
  return values
}

const parseCodegenEnum = (schemaTypes, enumName) => {
  const block = schemaTypes.match(new RegExp(`export enum ${enumName} \\{([\\s\\S]*?)\\n\\}`))
  if (!block) {
    throw new Error(`could not find enum ${enumName} in schema-types.ts`)
  }
  return new Map([...block[1].matchAll(/^\s*(\w+) = '([^']+)',?/gm)].map(([, member, value]) => [value, member]))
}

const parseGoString = (literal, context) => {
  try {
    return JSON.parse(literal)
  } catch (error) {
    throw new Error(`could not decode Go string ${literal} (${context}): ${error.message}`)
  }
}

const splitTopLevelEntries = (body, label) => {
  const entries = []
  let start = -1
  let lastEnd = 0
  let outside = ''
  scanBraces(body, 0, (depth, i) => {
    if (depth === 1 && body[i] === '{') {
      outside += body.slice(lastEnd, i)
      start = i + 1
    } else if (depth === 0) {
      entries.push(body.slice(start, i))
      lastEnd = i + 1
    }
    return true
  })
  outside += body.slice(lastEnd)
  const stray = outside.replace(/\/\/[^\n]*/g, '').replace(/[\s,]/g, '')
  if (stray) throw new Error(`${label} contains entries this generator cannot parse: ${stray.slice(0, 80)}`)
  return entries
}

const STRING_FIELD = (name) => new RegExp(`^\\s*${name}:\\s*("(?:[^"\\\\]|\\\\.)*")`, 'm')
const ENUM_FIELD = (name) => new RegExp(`^\\s*${name}:\\s*enums\\.(\\w+)`, 'm')

const assertParsedWhenPresent = (entry, field, match, key) => {
  if (!match && new RegExp(`^\\s*${field}:`, 'm').test(entry)) {
    throw new Error(`default vendor scoring question ${key}: ${field} is not a plain literal this generator can read`)
  }
}

const literalField = (name) => new RegExp(`${STRING_FIELD(name).source}\\s*,?\\s*$`, 'm')

const readField = (entry, pattern, label, key) => {
  const match = entry.match(pattern)
  if (!match) {
    throw new Error(`default vendor scoring question ${key ?? '(unknown key)'} has no ${label}`)
  }
  return match[1]
}

const resolveEnum = (goValues, codegenMembers, constant, label, key) => {
  const value = goValues.get(constant)
  if (!value) {
    throw new Error(`question ${key}: ${label} constant enums.${constant} is not a known core enum value`)
  }
  const member = codegenMembers.get(value)
  if (!member) {
    throw new Error(`question ${key}: ${label} value ${value} is missing from the codegen enum; regenerate schema-types.ts first`)
  }
  return member
}

const parseQuestions = (models, enums) => {
  const body = extractBlock(models, 'var DefaultVendorScoringQuestions = []VendorScoringQuestionDef{', 'DefaultVendorScoringQuestions')

  const questions = splitTopLevelEntries(body, 'DefaultVendorScoringQuestions').map((entry) => {
    const key = parseGoString(readField(entry, STRING_FIELD('Key'), 'Key'), 'Key')
    const nameMatch = entry.match(literalField('Name'))
    const descriptionMatch = entry.match(literalField('Description'))
    const optionsMatch = entry.match(/^\s*AnswerOptions:\s*\[\]string\{((?:\s*"(?:[^"\\]|\\.)*"\s*,?)*)\s*\}\s*,?\s*$/m)
    const enabledMatch = entry.match(/^\s*Enabled:\s*(true|false)\s*,?\s*$/m)
    assertParsedWhenPresent(entry, 'Name', nameMatch, key)
    assertParsedWhenPresent(entry, 'Description', descriptionMatch, key)
    assertParsedWhenPresent(entry, 'AnswerOptions', optionsMatch, key)
    assertParsedWhenPresent(entry, 'Enabled', enabledMatch, key)
    if (!nameMatch) throw new Error(`default vendor scoring question ${key} has no Name`)
    const enabled = enabledMatch?.[1] === 'true'

    return {
      key,
      name: parseGoString(nameMatch[1], `${key} Name`),
      description: descriptionMatch ? parseGoString(descriptionMatch[1], `${key} Description`) : undefined,
      category: resolveEnum(enums.category.go, enums.category.codegen, readField(entry, ENUM_FIELD('Category'), 'Category', key), 'Category', key),
      answerType: resolveEnum(enums.answerType.go, enums.answerType.codegen, readField(entry, ENUM_FIELD('AnswerType'), 'AnswerType', key), 'AnswerType', key),
      answerOptions: optionsMatch ? [...optionsMatch[1].matchAll(/"(?:[^"\\]|\\.)*"/g)].map(([literal]) => parseGoString(literal, `${key} AnswerOptions`)) : undefined,
      suggestedImpact: resolveEnum(enums.impact.go, enums.impact.codegen, readField(entry, ENUM_FIELD('SuggestedImpact'), 'SuggestedImpact', key), 'SuggestedImpact', key),
      enabled,
    }
  })

  if (questions.length === 0) {
    throw new Error('DefaultVendorScoringQuestions parsed to zero questions')
  }

  const declaredKeys = (body.match(/^\s*Key:/gm) ?? []).length
  if (declaredKeys !== questions.length) {
    throw new Error(`DefaultVendorScoringQuestions declares ${declaredKeys} keys but ${questions.length} questions were parsed`)
  }

  const keys = new Set()
  questions.forEach(({ key }) => {
    if (keys.has(key)) throw new Error(`duplicate default vendor scoring question key ${key}`)
    keys.add(key)
  })

  return questions
}

const parseThresholds = (models, ratingValues) => {
  const constants = new Map([...models.matchAll(/^\s*(defaultRisk\w+MaxScore)\s*=\s*(\d+(?:\.\d+)?)/gm)].map(([, name, value]) => [name, Number(value)]))
  const body = extractBlock(models, 'var DefaultRiskThresholds = []RiskThreshold{', 'DefaultRiskThresholds')

  const thresholds = splitTopLevelEntries(body, 'DefaultRiskThresholds').map((entry) => {
    const ratingConstant = entry.match(/Rating:\s*enums\.(\w+)/)?.[1]
    const rawMax = entry.match(/MaxScore:\s*([\w.]+)/)?.[1]
    const rating = ratingValues.get(ratingConstant)
    const maxScore = constants.has(rawMax) ? constants.get(rawMax) : Number(rawMax)

    if (!rating || !Number.isFinite(maxScore)) {
      throw new Error(`could not parse DefaultRiskThresholds entry: ${entry.trim()}`)
    }
    return { rating, maxScore }
  })

  if (thresholds.length === 0) {
    throw new Error('DefaultRiskThresholds parsed to zero entries')
  }

  const ratings = new Set(thresholds.map(({ rating }) => rating))
  const missing = [...ratingValues.values()].filter((rating) => !ratings.has(rating))
  if (ratings.size !== thresholds.length || missing.length > 0) {
    throw new Error(`DefaultRiskThresholds must list every rating exactly once (missing: ${missing.join(', ') || 'none'})`)
  }

  return thresholds
}

const emitString = (value) => JSON.stringify(value)

const emitQuestion = (question) => {
  const lines = [
    `key: ${emitString(question.key)}`,
    `name: ${emitString(question.name)}`,
    question.description !== undefined ? `description: ${emitString(question.description)}` : null,
    `category: ${CODEGEN_ENUMS.category}.${question.category}`,
    `answerType: ${CODEGEN_ENUMS.answerType}.${question.answerType}`,
    question.answerOptions ? `answerOptions: [${question.answerOptions.map(emitString).join(', ')}]` : null,
    `suggestedImpact: ${CODEGEN_ENUMS.impact}.${question.suggestedImpact}`,
    `enabled: ${question.enabled}`,
  ].filter(Boolean)
  return `  {\n${lines.map((line) => `    ${line},`).join('\n')}\n  },`
}

const toConstantKey = (value) => value.replace(/[^A-Z0-9_]/g, '_')

const main = async () => {
  const [models, categorySource, answerTypeSource, impactSource, ratingSource] = await Promise.all(Object.values(SOURCES).map(readSource))
  const schemaTypes = fs.readFileSync(schemaTypesPath, 'utf8')

  assertJsonTags(models, 'VendorScoringQuestionDef', QUESTION_JSON_TAGS)
  assertJsonTags(models, 'RiskThreshold', THRESHOLD_JSON_TAGS)
  assertJsonTags(models, 'VendorScoringQuestionsConfig', { Custom: 'custom' })
  assertJsonTags(models, 'RiskThresholdsConfig', { Custom: 'custom' })

  const enums = {
    category: { go: parseGoEnum(categorySource, 'VendorScoringCategory'), codegen: parseCodegenEnum(schemaTypes, CODEGEN_ENUMS.category) },
    answerType: { go: parseGoEnum(answerTypeSource, 'VendorScoringAnswerType'), codegen: parseCodegenEnum(schemaTypes, CODEGEN_ENUMS.answerType) },
    impact: { go: parseGoEnum(impactSource, 'VendorRiskImpact'), codegen: parseCodegenEnum(schemaTypes, CODEGEN_ENUMS.impact) },
  }
  const ratingValues = parseGoEnum(ratingSource, 'VendorRiskRating')

  const questions = parseQuestions(models, enums)
  const thresholds = parseThresholds(models, ratingValues)

  const output = `/* eslint-disable */
// Generated by plugins/generate-vendor-scoring-defaults.js from core's common/models/vendorscoring.go — do not edit.
import { ${Object.values(CODEGEN_ENUMS).join(', ')} } from './schema-types'

export const VendorRiskRating = {
${[...ratingValues.values()].map((value) => `  ${toConstantKey(value)}: '${value}',`).join('\n')}
} as const

export type TVendorRiskRating = (typeof VendorRiskRating)[keyof typeof VendorRiskRating]

export type TVendorScoringQuestionDef = {
  key: string
  name: string
  description?: string
  category: ${CODEGEN_ENUMS.category}
  answerType: ${CODEGEN_ENUMS.answerType}
  answerOptions?: string[]
  suggestedImpact: ${CODEGEN_ENUMS.impact}
  enabled: boolean
}

export type TVendorRiskThreshold = {
  rating: TVendorRiskRating
  maxScore: number
}

export type TVendorScoringQuestionInput = Omit<TVendorScoringQuestionDef, 'key'> & { key?: string }

export type TVendorScoringQuestionsConfig = { custom?: TVendorScoringQuestionInput[] | null }

export type TVendorRiskThresholdsConfig = { custom?: TVendorRiskThreshold[] | null }

export const DEFAULT_VENDOR_SCORING_QUESTIONS: readonly TVendorScoringQuestionDef[] = [
${questions.map(emitQuestion).join('\n')}
]

export const DEFAULT_VENDOR_RISK_THRESHOLDS: readonly TVendorRiskThreshold[] = [
${thresholds.map(({ rating, maxScore }) => `  { rating: VendorRiskRating.${toConstantKey(rating)}, maxScore: ${maxScore} },`).join('\n')}
]
`

  fs.writeFileSync(outputPath, output)
  console.log(`✔ vendor scoring defaults → ${path.relative(process.cwd(), outputPath)} (${questions.length} questions, ${thresholds.length} thresholds)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
