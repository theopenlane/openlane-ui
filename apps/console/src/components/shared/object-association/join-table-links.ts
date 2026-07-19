export type TJoinLinkDiff = {
  add: readonly string[]
  remove: readonly string[]
}

export type TJoinKeyFamily<TKey extends string> = TKey | `add${Capitalize<TKey>}` | `remove${Capitalize<TKey>}` | `clear${Capitalize<TKey>}`

const asIdArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [])

export const splitJoinTableInput = <TKey extends string, TInput extends object>(input: TInput, joinFieldKey: TKey): { entityInput: Omit<TInput, TJoinKeyFamily<TKey>>; links: TJoinLinkDiff } => {
  const capitalized = `${joinFieldKey.charAt(0).toUpperCase()}${joinFieldKey.slice(1)}`
  const addKey = `add${capitalized}`
  const removeKey = `remove${capitalized}`
  const clearKey = `clear${capitalized}`

  const entityInput: Record<string, unknown> = {}
  const add: string[] = []
  const remove: string[] = []

  for (const [key, value] of Object.entries(input)) {
    if (key === joinFieldKey || key === addKey) add.push(...asIdArray(value))
    else if (key === removeKey) remove.push(...asIdArray(value))
    else if (key !== clearKey) entityInput[key] = value
  }

  return {
    entityInput: entityInput as Omit<TInput, TJoinKeyFamily<TKey>>,
    links: { add: [...new Set(add)], remove: [...new Set(remove)] },
  }
}
