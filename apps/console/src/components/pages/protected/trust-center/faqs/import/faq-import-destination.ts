import { type CreateTrustCenterFaqInput } from '@repo/codegen/src/schema'
import { serializeCsv } from '@/components/shared/record-import/lib/delimited-file'
import type { TDestinationField, TImportAutomaticValue, TImportDestination, TImportRecord } from '@/components/shared/record-import/lib/types'

const FAQ_IMPORT_FIELDS = {
  Question: { label: 'Question', requirement: 'required', description: 'The question buyers ask', example: 'Do you encrypt customer data at rest?' },
  Answer: { label: 'Answer', requirement: 'required', description: 'The answer shown under the question', example: 'Yes. All customer data is encrypted at rest with AES-256.' },
  ReferenceLink: { label: 'Reference Link', description: 'A web address where buyers can read more', example: 'https://example.com/security', format: 'url' },
  Category: { label: 'Category', description: 'The FAQ category; a new category is created when none matches', example: 'Security' },
} as const satisfies Record<string, Omit<TDestinationField, 'name' | 'fuzzyMatchable'>>

type TFaqImportField = keyof typeof FAQ_IMPORT_FIELDS

const fields: TDestinationField[] = Object.entries(FAQ_IMPORT_FIELDS).map(([name, details]) => ({ name, fuzzyMatchable: true, ...details }))

export const FAQ_IMPORT_DESTINATION: TImportDestination = {
  fieldSet: {
    fields,
    fixedFields: [],
    requiredGroups: fields.filter((field) => field.requirement === 'required').map((field) => [field]),
    uniqueFields: [],
    primaryField: 'Question',
  },
  exampleCsv: serializeCsv(
    fields.map((field) => field.name),
    [fields.map((field) => field.example ?? '')],
  ),
  exampleFilename: 'trust-center-faqs',
}

const FAQ_AUTOMATIC = {
  trustCenterID: { label: 'Trust Center', value: 'Linked' },
  displayOrder: { label: 'Display Order', value: 'Appended' },
} satisfies Partial<Record<keyof CreateTrustCenterFaqInput, TImportAutomaticValue>>

export const FAQ_AUTOMATIC_VALUES: readonly TImportAutomaticValue[] = Object.values(FAQ_AUTOMATIC)

type TFaqAutomaticInput = { [K in keyof typeof FAQ_AUTOMATIC]-?: NonNullable<CreateTrustCenterFaqInput[K]> }

const readField = (record: TImportRecord, name: TFaqImportField): string | undefined => record[name]?.trim() || undefined

export const toFaqInputs = (records: TImportRecord[], { trustCenterID, displayOrder: firstDisplayOrder }: TFaqAutomaticInput): CreateTrustCenterFaqInput[] =>
  records.map((record, index) => ({
    createNote: { title: readField(record, 'Question'), text: readField(record, 'Answer') ?? '' },
    referenceLink: readField(record, 'ReferenceLink'),
    trustCenterFaqKindName: readField(record, 'Category'),
    displayOrder: firstDisplayOrder + index,
    trustCenterID,
    noteID: '',
  }))
