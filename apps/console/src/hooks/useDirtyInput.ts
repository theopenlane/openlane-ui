import { useCallback } from 'react'
import { type DeepPartial, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { type TAssociationUpdateInput, type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { isPlateValueEmpty, type TPlateHtmlConverter } from '@/components/shared/plate/plate-utils'
import { isRecord } from '@/utils/type-guards'

type TFormKey<TForm> = Extract<keyof TForm, string>

type TClearKeyOf<K extends string> = Lowercase<`clear${K}`> | (K extends `${infer TBase}ID` ? Lowercase<`clear${TBase}`> : never)

type TClearKeyFor<TInput, K extends string> = {
  [P in keyof TInput]-?: P extends string ? (Lowercase<P> extends TClearKeyOf<K> ? P : never) : never
}[keyof TInput]

type TPassthroughKey<TForm, TInput> = {
  [K in TFormKey<TForm>]-?: K extends keyof TInput ? ([TClearKeyFor<TInput, K>] extends [never] ? ([TForm[K]] extends [TInput[K]] ? K : never) : never) : never
}[TFormKey<TForm>]

export type TMapperContext<TForm> = {
  defaultValues: Readonly<DeepPartial<TForm>> | undefined
  converter: TPlateHtmlConverter
}

export type TFieldMapper<TForm, TInput, K extends TFormKey<TForm>> = (value: TForm[K], values: TForm, context: TMapperContext<TForm>) => Partial<TInput> | Promise<Partial<TInput>>

type TValueRuleKind = 'value' | 'richText' | 'date'

type TValueRule<TKind extends TValueRuleKind, TClearKey extends string> = { readonly kind: TKind; readonly clearKey: TClearKey }

type TValueRuleFor<TForm, TInput, K extends TFormKey<TForm>> = K extends keyof TInput
  ? ([NonNullable<TForm[K]>] extends [NonNullable<TInput[K]>] ? TValueRule<'value', TClearKeyFor<TInput, K>> : never) | TValueRule<'richText' | 'date', TClearKeyFor<TInput, K>>
  : never

type TPassthroughRule = { readonly kind: 'passthrough' }

type TFieldRule<TForm, TInput, K extends TFormKey<TForm>> = TFieldMapper<TForm, TInput, K> | TValueRuleFor<TForm, TInput, K> | (K extends TPassthroughKey<TForm, TInput> ? TPassthroughRule : never)

export type TFieldMappers<TForm, TInput> = {
  [K in TFormKey<TForm>]-?: TFieldRule<TForm, TInput, K>
}

export const passthrough: TPassthroughRule = { kind: 'passthrough' }

export const orClear = <TClearKey extends string>(clearKey: TClearKey): TValueRule<'value', TClearKey> => ({ kind: 'value', clearKey })

export const richTextOrClear = <TClearKey extends string>(clearKey: TClearKey): TValueRule<'richText', TClearKey> => ({ kind: 'richText', clearKey })

export const dateOrClear = <TClearKey extends string>(clearKey: TClearKey): TValueRule<'date', TClearKey> => ({ kind: 'date', clearKey })

export const omit = (): Record<never, never> => ({})

export const associationsInput =
  <TKey extends string>(key: TKey) =>
  (ids: string[] | null | undefined, _values: object, { defaultValues }: Pick<TMapperContext<Partial<Record<TKey, string[] | null>>>, 'defaultValues'>): TAssociationUpdateInput<TKey> => {
    const initialIds = defaultValues?.[key]
    const initial: TObjectAssociationMap<TKey> = {}
    const current: TObjectAssociationMap<TKey> = {}
    initial[key] = Array.isArray(initialIds) ? initialIds.flatMap((id) => (typeof id === 'string' ? [id] : [])) : []
    current[key] = ids ?? []
    return getAssociationInput(initial, current)
  }

export const isEmptyInputValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0) ||
  (value instanceof Date && Number.isNaN(value.getTime()))

const toDateInput = (value: unknown): unknown => (value instanceof Date ? value.toISOString() : value)

const isValueRule = (rule: unknown): rule is TValueRule<TValueRuleKind, string> => isRecord(rule) && typeof rule.kind === 'string' && typeof rule.clearKey === 'string'

const isRuleless = (rule: unknown): boolean => rule === undefined || rule === omit

const applyValueRule = async (rule: TValueRule<TValueRuleKind, string>, name: string, value: unknown, converter: TPlateHtmlConverter): Promise<[string, unknown]> => {
  if (rule.kind === 'richText') {
    if (typeof value === 'string') {
      return isPlateValueEmpty(value) ? [rule.clearKey, true] : [name, value]
    }
    return Array.isArray(value) && !isPlateValueEmpty(value) ? [name, await converter.convertToHtml(value)] : [rule.clearKey, true]
  }

  if (isEmptyInputValue(value)) {
    return [rule.clearKey, true]
  }

  return [name, rule.kind === 'date' ? toDateInput(value) : value]
}

const hasDirtyLeaf = (mark: unknown): boolean => {
  if (mark === true) {
    return true
  }

  if (Array.isArray(mark)) {
    return mark.some(hasDirtyLeaf)
  }

  return isRecord(mark) && Object.values(mark).some(hasDirtyLeaf)
}

const toInputFragment = <TInput extends object>(key: string, value: unknown): Partial<TInput> => Object.fromEntries([[key, value]]) as Partial<TInput>

const runRule = async <TForm extends FieldValues, TInput extends object>(
  rules: Partial<Record<string, unknown>>,
  name: TFormKey<TForm>,
  values: TForm,
  context: TMapperContext<TForm>,
): Promise<Partial<TInput>> => {
  const rule = rules[name]

  if (typeof rule === 'function') {
    return rule(values[name], values, context)
  }

  if (isValueRule(rule)) {
    return toInputFragment<TInput>(...(await applyValueRule(rule, name, values[name], context.converter)))
  }

  if (rule === passthrough) {
    return toInputFragment<TInput>(name, values[name])
  }

  return {}
}

const warnDroppedFields = (dirtyNames: string[], fragments: object[], rules: Partial<Record<string, unknown>>) => {
  const unlisted = dirtyNames.filter((name) => rules[name] === undefined)
  if (unlisted.length > 0) {
    console.warn('[useDirtyInput] Dirty fields have no rule in the field table, so they are not sent:', unlisted.join(', '))
  }
  const dropped = dirtyNames.filter((name, index) => !isRuleless(rules[name]) && Object.values(fragments[index] ?? {}).every((value) => value === undefined))
  if (dropped.length > 0) {
    console.warn('[useDirtyInput] Dirty fields produced no input key, so the edit is not sent:', dropped.join(', '))
  }
}

export const useDirtyInput = <TForm extends FieldValues>(form: UseFormReturn<TForm>) => {
  const { dirtyFields: renderedDirtyFields } = form.formState
  const converter = usePlateEditor()

  return useCallback(
    async <TInput extends object>(values: TForm, mappers: TFieldMappers<TForm, TInput>, { extras }: { extras?: Partial<TInput> } = {}): Promise<Partial<TInput>> => {
      const { dirtyFields = renderedDirtyFields, defaultValues } = form.control._formState
      const dirtyNames = (Object.keys(dirtyFields) as TFormKey<TForm>[]).filter((name) => hasDirtyLeaf(Reflect.get(dirtyFields, name)))
      const context: TMapperContext<TForm> = { defaultValues, converter }

      const fragments: Partial<TInput>[] = []
      for (const name of dirtyNames) {
        fragments.push(await runRule<TForm, TInput>(mappers, name, values, context))
      }

      if (process.env.NODE_ENV !== 'production') {
        warnDroppedFields(dirtyNames, fragments, mappers)
      }

      const input = Object.fromEntries(fragments.flatMap((fragment) => Object.entries(fragment)).filter(([, value]) => value !== undefined)) as Partial<TInput>

      return Object.keys(input).length > 0 && extras ? { ...extras, ...input } : input
    },
    [form, converter, renderedDirtyFields],
  )
}
