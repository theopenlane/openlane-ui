import { type CloneControlUploadInput, type CreateControlInput } from '@repo/codegen/src/schema'
import { IMPORT_FIELDS, type ImportFieldKind } from '@repo/codegen/src/import-fields.generated'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { staticImportDestination } from '@/components/shared/record-import/lib/destination-fields'
import type { TDestinationField, TImportDestination } from '@/components/shared/record-import/lib/types'
import { normalizeFieldName, toHumanLabel } from '@/utils/strings'
import { capitalizeFirstLetter } from '@/lib/auth/utils/strings'

type TCloneField = Omit<TDestinationField, 'name' | 'fuzzyMatchable' | 'label'> & Partial<Pick<TDestinationField, 'label' | 'fuzzyMatchable'>>

const CLONE_UPLOAD_FIELDS = {
  StandardShortName: { label: 'Standard', requirement: 'required', fuzzyMatchable: false, description: 'Short name of the standard to clone the control from', example: 'SOC 2' },
  StandardVersion: {
    fuzzyMatchable: false,
    blankIsInvalid: true,
    description: 'Version of the standard to clone from. Leave the column unmapped to use the latest version; when mapped, every row of a standard needs the same version',
  },
  RefCode: { label: 'Ref Code', requirement: 'required', description: 'Reference code of the control or subcontrol in the standard', example: 'CC1.1' },
  ControlImplementation: { description: 'How the control is implemented in your organization', example: 'Access reviews run quarterly in the identity provider.' },
  ControlObjective: { description: 'The objective the control is meant to achieve' },
  ImplementationGuidance: { description: 'Guidance on implementing the control' },
  Comment: { description: 'A comment to add to the control' },
  InternalPolicyID: {
    label: 'Internal Policy ID',
    fuzzyMatchable: false,
    blankIsInvalid: true,
    description: 'ID of an internal policy to link to the control; when mapped, every row needs one',
    meta: { kind: 'id' },
  },
} satisfies Partial<Record<Capitalize<keyof CloneControlUploadInput>, TCloneField>>

const CONTROL_INPUT_PREFIX = 'ControlInput.' satisfies `${Capitalize<Extract<keyof CloneControlUploadInput, 'controlInput'>>}.`

const CLONE_OWNED_CONTROL_KEYS = ['refCode', 'referenceFramework', 'referenceFrameworkRevision', 'source', 'implementationGuidance'] as const satisfies readonly (keyof CreateControlInput)[]

const ALIASABLE_KINDS: ReadonlySet<ImportFieldKind> = new Set(['string', 'number', 'boolean', 'date', 'enum'])
const EDGE_LOOKUP_NAME = /Name$/

const uploadFields: TDestinationField[] = Object.entries<TCloneField>(CLONE_UPLOAD_FIELDS).map(([name, { label, ...details }]) => ({
  name,
  label: label ?? toHumanLabel(name),
  fuzzyMatchable: true,
  ...details,
}))

const isCloneOwned = (key: string): boolean => CLONE_OWNED_CONTROL_KEYS.some((owned) => normalizeFieldName(owned) === normalizeFieldName(key))

const controlInputFields: TDestinationField[] = Object.entries(IMPORT_FIELDS[ObjectTypes.CONTROL] ?? {})
  .filter(([key, meta]) => meta.kind !== 'id' && !meta.adminOnly && !isCloneOwned(key))
  .map(([key, meta]) => {
    const isScalar = !meta.list && ALIASABLE_KINDS.has(meta.kind) && !EDGE_LOOKUP_NAME.test(key)
    return {
      name: `${CONTROL_INPUT_PREFIX}${capitalizeFirstLetter(key)}`,
      label: toHumanLabel(key),
      description: meta.description,
      fuzzyMatchable: isScalar,
      aliases: isScalar ? [key] : undefined,
      meta,
    }
  })

export const CONTROL_STANDARDS_IMPORT_DESTINATION: TImportDestination = staticImportDestination(
  { fields: [...uploadFields, ...controlInputFields], primaryField: 'RefCode' },
  'controls-from-standards',
)
