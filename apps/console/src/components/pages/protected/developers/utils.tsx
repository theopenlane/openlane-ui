const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`
const getOrganizationsDifferences = (initial: string[], current: string[]): { added: string[]; removed: string[] } => {
  let added: string[] = []
  let removed: string[] = []

  const initialSet = new Set(initial ?? [])
  const currentSet = new Set(current ?? [])

  const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
  const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

  if (addedItems.length > 0) added = addedItems
  if (removedItems.length > 0) removed = removedItems

  return { added, removed }
}

export const buildOrganizationsInput = (initialData: string[], current: string[], fieldName: string) => {
  const { added, removed } = getOrganizationsDifferences(initialData, current)

  const result: Record<string, string[]> = {}
  if (added.length > 0) result[buildMutationKey('add', fieldName)] = added
  if (removed.length > 0) result[buildMutationKey('remove', fieldName)] = removed

  return result
}
