import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import { isStringArray } from '@/utils/type-guards'

export type TResponsibilityFilterKind = 'user' | 'group'

export type TResponsibilityFilterOption = { value: string; label: string }

type TResponsibilityFilterWhereKeys<B extends string> = `${B}UserIDIn` | `${B}GroupIDIn`

type TResponsibilityFilterClause<B extends string> = Partial<Record<TResponsibilityFilterWhereKeys<B>, string[]>>

type TResponsibilityFilterWhere<B extends string> = { or?: TResponsibilityFilterClause<B>[] }

export const responsibilityFilterValue = (kind: TResponsibilityFilterKind, id: string) => `${kind}:${id}`

const idsOfKind = (values: string[], kind: TResponsibilityFilterKind) => {
  const prefix = responsibilityFilterValue(kind, '')
  return values.filter((value) => value.startsWith(prefix)).map((value) => value.slice(prefix.length))
}

export const responsibilityFilterFor =
  <TWhereInput extends { or?: unknown }>() =>
  <const B extends string>(fieldBaseName: TResponsibilityFilterWhereKeys<B> extends keyof TWhereInput ? B : never) => {
    const key = `${fieldBaseName}UserOrGroup` as const

    const field = (label: string, options: TResponsibilityFilterOption[]) => ({ key, label, type: 'dropdownSearchMultiselect' as const, icon: FilterIcons.Owners, options })

    const toWhere = (filterKey: string, value: unknown): TResponsibilityFilterWhere<B> | undefined => {
      if (filterKey !== key) return undefined
      if (!isStringArray(value)) return {}

      const clause = (column: TResponsibilityFilterWhereKeys<B>, ids: string[]): TResponsibilityFilterClause<B>[] => (ids.length > 0 ? [{ [column]: ids } as TResponsibilityFilterClause<B>] : [])
      const clauses = [...clause(`${fieldBaseName}UserIDIn`, idsOfKind(value, 'user')), ...clause(`${fieldBaseName}GroupIDIn`, idsOfKind(value, 'group'))]

      return clauses.length > 0 ? { or: clauses } : {}
    }

    return { key, field, toWhere }
  }
