const SCOPE_ACTION_ORDER = ['read', 'write', 'delete']

const sortScopeActions = (a: string, b: string) => {
  const ai = SCOPE_ACTION_ORDER.indexOf(a)
  const bi = SCOPE_ACTION_ORDER.indexOf(b)
  if (ai === -1 && bi === -1) return a.localeCompare(b)
  if (ai === -1) return 1
  if (bi === -1) return -1
  return ai - bi
}

export const groupScopesByResource = (scopes: readonly string[]) => {
  const grouped = scopes.reduce<Record<string, string[]>>((acc, scope) => {
    const colon = scope.indexOf(':')
    const resource = colon === -1 ? scope : scope.slice(0, colon)
    const action = colon === -1 ? '' : scope.slice(colon + 1)
    ;(acc[resource] ??= []).push(action)
    return acc
  }, {})
  Object.values(grouped).forEach((actions) => actions.sort(sortScopeActions))
  return grouped
}

export const formatScopeActions = (actions: string[]) => actions.join(' · ')
