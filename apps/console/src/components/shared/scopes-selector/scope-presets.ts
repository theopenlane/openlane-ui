export type TScopePreset = {
  key: string
  label: string
  description: string
  includesPermission: (permission: string) => boolean
}

export type TScopeGroup = [objectType: string, permissions: string[]]

export const SCOPE_PRESETS: TScopePreset[] = [
  {
    key: 'read-only',
    label: 'Read only',
    description: 'Read access on every object. No writes or deletes.',
    includesPermission: (permission) => permission === 'read',
  },
  {
    key: 'read-write',
    label: 'Read & write',
    description: 'Read and write access on every object. No deletes.',
    includesPermission: (permission) => permission === 'read' || permission === 'write',
  },
  {
    key: 'full-access',
    label: 'Full access',
    description: 'Every permission on every object.',
    includesPermission: () => true,
  },
]

export const buildPresetScopes = (groups: TScopeGroup[], preset: TScopePreset): string[] =>
  groups.flatMap(([objectType, permissions]) => permissions.filter((permission) => preset.includesPermission(permission)).map((permission) => `${objectType}:${permission}`))

export const getActivePresetKey = (groups: TScopeGroup[], value: string[]): string | null => {
  if (value.length === 0) return null
  const valueSet = new Set(value)
  const activePreset = SCOPE_PRESETS.find((preset) => {
    const presetScopes = buildPresetScopes(groups, preset)
    return presetScopes.length === valueSet.size && presetScopes.every((scope) => valueSet.has(scope))
  })
  return activePreset?.key ?? null
}
