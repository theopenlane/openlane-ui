import type React from 'react'
import type { MergeableEdgeNamesFor, MergeableFieldNamesFor, MergeableTypeName } from '@repo/codegen/src/merge-fields.generated'

export type MergeSource = 'primary' | 'secondary'

export type MergeArrayStrategy = 'union' | 'choose'

export type MergeFieldType = 'text' | 'longText' | 'date' | 'enum' | 'boolean' | 'tags' | 'map' | 'customEnum' | 'number'

export type MergeEnumOption = { value: string; label: string }

export type MergeFieldConfig<TRecord> = {
  key: Extract<keyof TRecord, string>
  label: string
  type: MergeFieldType
  enumOptions?: MergeEnumOption[]
  customEnum?: { objectType?: string; field: string }
  render?: (value: unknown) => React.ReactNode
}

export type MergeFieldOverride<TRecord> = Omit<MergeFieldConfig<TRecord>, 'key'>

export type MergeFieldOverrides<TRecord> = Partial<Record<Extract<keyof TRecord, string>, MergeFieldOverride<TRecord>>>

export type MergeSearchOption = { id: string; label: string; sublabel?: string }

export type MergeSearchHookResult = {
  options: MergeSearchOption[]
  isLoading: boolean
}

export type MergeFetchHookResult<TRecord> = {
  data: TRecord | null | undefined
  isLoading: boolean
  error?: unknown
}

export type MergeUpdateMutation<TUpdateInput> = {
  mutateAsync: (vars: { id: string; input: TUpdateInput }) => Promise<unknown>
  isPending: boolean
}

export type MergeDeleteMutation = {
  mutateAsync: (id: string) => Promise<unknown>
  isPending: boolean
}

export type MergeEmailAliasFoldConfig<TRecord> = {
  emailKey: Extract<keyof TRecord, string>
  aliasesKey: Extract<keyof TRecord, string>
  defaultOn: boolean
  label: string
}

export type MergeEdgeTransferCount = {
  key: string
  label: string
  count: number
}

export type MergePreSaveExtrasResult<TUpdateInput> = {
  data: Partial<TUpdateInput>
  counts: MergeEdgeTransferCount[]
}

export type MergeConfig<TRecord, TUpdateInput, TEntity extends MergeableTypeName = MergeableTypeName> = {
  entityType: TEntity
  labelSingular: string
  labelPlural: string
  fieldOverrides?: MergeFieldOverrides<TRecord>
  excludeFields?: ReadonlyArray<Extract<keyof TRecord, string>>
  schemaExcludeFields?: ReadonlyArray<MergeableFieldNamesFor<TEntity>>
  excludeEdges?: ReadonlyArray<MergeableEdgeNamesFor<TEntity>>
  useFetchRecord: (id: string | null) => MergeFetchHookResult<TRecord>
  useUpdate: () => MergeUpdateMutation<TUpdateInput>
  useDelete: () => MergeDeleteMutation
  toUpdateInput: (resolved: Partial<TRecord>) => TUpdateInput
  useSearchRecords: (search: string, excludeId: string) => MergeSearchHookResult
  invalidateKeys?: unknown[][]
  getDisplayName?: (record: TRecord) => string
  emailAliasFold?: MergeEmailAliasFoldConfig<TRecord>
  preSaveInputExtras?: (args: { primary: TRecord; secondary: TRecord }) => MergePreSaveExtrasResult<TUpdateInput>
  deleteSecondaryFirst?: boolean
}
