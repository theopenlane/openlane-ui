export function whereGenerator<TWhereInput extends object>(filters: TWhereInput | null, mapCustomKey: (key: string, value: unknown) => TWhereInput): TWhereInput {
  const conditions: TWhereInput = {} as TWhereInput

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value == null || value === '' || value === false) return

    if ((key === 'and' || key === 'or') && Array.isArray(value)) {
      ;(conditions as Record<string, unknown>)[key] = value.map((entry) => {
        const sub = {} as TWhereInput

        Object.entries(entry as Record<string, unknown>).forEach(([innerKey, innerValue]) => {
          Object.assign(sub, mapCustomKey(innerKey, innerValue))
        })

        return sub
      })
    } else {
      Object.assign(conditions, mapCustomKey(key, value))
    }
  })

  return conditions
}

export const whereContainsKey = <T extends { and?: T[] | null; or?: T[] | null }>(where: T | null | undefined, key: keyof T & string): boolean => {
  if (!where) return false
  if (key in where) return true
  return (where.and ?? []).some((c) => whereContainsKey(c, key)) || (where.or ?? []).some((c) => whereContainsKey(c, key))
}
