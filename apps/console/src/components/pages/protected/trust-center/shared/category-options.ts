import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { objectToSnakeCase } from '@/utils/strings'

const CATEGORIES_KEY_SEPARATOR = '\u0000'

export const categoryEnumWhere = (objectType: ObjectTypes) => ({ objectType: objectToSnakeCase(objectType), field: 'kind' })

export const SUBPROCESSOR_CATEGORY_WHERE = categoryEnumWhere(ObjectTypes.TRUST_CENTER_SUBPROCESSOR)

export const toCategoriesKey = (categories: Iterable<string>): string => [...new Set(categories)].filter(Boolean).join(CATEGORIES_KEY_SEPARATOR)

export const splitCategoriesKey = (key: string): string[] => (key ? key.split(CATEGORIES_KEY_SEPARATOR) : [])

export const withChosenCategoryOptions = (options: CustomTypeEnumOption[], chosen: readonly string[]): CustomTypeEnumOption[] => {
  const known = new Set(options.map((option) => option.value.toLowerCase()))
  const extra = [...new Set(chosen)].filter((category) => category && !known.has(category.toLowerCase()))
  return extra.length > 0 ? [...options, ...extra.map((category) => ({ value: category, label: category }))] : options
}
