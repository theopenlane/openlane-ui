import { useCallback } from 'react'
import { type DeepPartial, type FieldNamesMarkedBoolean, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { isRecord, isStringArray } from '@/utils/type-guards'

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) {
    return true
  }

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime()
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]))
  }

  if (isPlainRecord(a) && isPlainRecord(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].every((key) => isDeepEqual(a[key], b[key]))
  }

  return false
}

const ATOMIC_GROUP = 'changedInputAtomicGroup'

export const atomicInputGroup = <T extends object>(input: T): T => ({ ...input, [Symbol(ATOMIC_GROUP)]: Object.keys(input) })

const atomicGroupsOf = (input: object): string[][] =>
  Object.getOwnPropertySymbols(input)
    .filter((symbol) => symbol.description === ATOMIC_GROUP)
    .map((symbol) => Reflect.get(input, symbol))
    .filter(isStringArray)

export type BuildInput<TFormData extends FieldValues, TInput extends object> = (values: TFormData) => TInput | Promise<TInput>

type BuildChangedInputParams<TFormData extends FieldValues, TInput extends object> = {
  values: TFormData
  defaultValues: Readonly<DeepPartial<NoInfer<TFormData>>> | undefined
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<NoInfer<TFormData>>>>
  build: BuildInput<NoInfer<TFormData>, TInput>
}

const buildChangedInput = async <TFormData extends FieldValues, TInput extends object>({ values, defaultValues, dirtyFields, build }: BuildChangedInputParams<TFormData, TInput>): Promise<TInput> => {
  const changedNames = new Set([...Object.keys(dirtyFields), ...Object.keys(values).filter((name) => !isDeepEqual(values[name], defaultValues?.[name]))])

  if (changedNames.size === 0) {
    return {} as TInput
  }

  const revertedFields = Object.fromEntries([...changedNames].map((name) => [name, defaultValues?.[name]])) as Partial<TFormData>

  const current = await build(values)
  const pristine = await build({ ...values, ...revertedFields })
  const pristineInput = new Map<string, unknown>(Object.entries(pristine))

  const changedKeys = new Set(Object.entries(current).flatMap(([key, value]) => (isDeepEqual(value, pristineInput.get(key)) ? [] : [key])))
  atomicGroupsOf(current)
    .filter((group) => group.some((key) => changedKeys.has(key)))
    .forEach((group) => group.forEach((key) => changedKeys.add(key)))

  return Object.fromEntries(Object.entries(current).filter(([key, value]) => value !== undefined && changedKeys.has(key))) as TInput
}

export const useChangedInput = <TFormData extends FieldValues>(form: UseFormReturn<TFormData>) => {
  const { dirtyFields, defaultValues } = form.formState

  return useCallback(<TInput extends object>(values: TFormData, build: BuildInput<TFormData, TInput>) => buildChangedInput({ values, defaultValues, dirtyFields, build }), [defaultValues, dirtyFields])
}
