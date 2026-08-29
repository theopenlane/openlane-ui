import { buildPresetScopes, getActivePresetKey, SCOPE_PRESETS, type TScopeGroup, type TScopePreset } from './scope-presets'

/**
 * #2077 — buildPresetScopes expands a preset over the object groups and getActivePresetKey does
 * the reverse. That reverse mapping has to be an exact set match, or a hand-picked selection is
 * mislabelled as a preset and silently widened when the preset is re-applied.
 */

const groups: TScopeGroup[] = [
  ['control', ['read', 'write', 'delete']],
  ['policy', ['read', 'write']],
]

const preset = (key: string): TScopePreset => {
  const found = SCOPE_PRESETS.find((p) => p.key === key)
  if (!found) throw new Error(`no scope preset named ${key}`)
  return found
}

describe('SCOPE_PRESETS', () => {
  test('exposes the three presets in widening order', () => {
    expect(SCOPE_PRESETS.map((p) => p.key)).toEqual(['read-only', 'read-write', 'full-access'])
  })
})

describe('buildPresetScopes', () => {
  test('read-only selects just the read permission of each object', () => {
    expect(buildPresetScopes(groups, preset('read-only'))).toEqual(['control:read', 'policy:read'])
  })

  test('read-write adds write but never delete', () => {
    const scopes = buildPresetScopes(groups, preset('read-write'))

    expect(scopes).toEqual(['control:read', 'control:write', 'policy:read', 'policy:write'])
    expect(scopes).not.toContain('control:delete')
  })

  test('full-access selects every permission of every object', () => {
    expect(buildPresetScopes(groups, preset('full-access'))).toEqual(['control:read', 'control:write', 'control:delete', 'policy:read', 'policy:write'])
  })

  test('returns nothing when there are no groups', () => {
    expect(buildPresetScopes([], preset('full-access'))).toEqual([])
  })

  test('skips an object that has no matching permission', () => {
    expect(buildPresetScopes([['audit', ['delete']]], preset('read-only'))).toEqual([])
  })
})

describe('getActivePresetKey', () => {
  test('returns null for an empty selection', () => {
    expect(getActivePresetKey(groups, [])).toBeNull()
  })

  test.each(['read-only', 'read-write', 'full-access'])('recognises an exact %s selection', (key) => {
    expect(getActivePresetKey(groups, buildPresetScopes(groups, preset(key)))).toBe(key)
  })

  test('recognises a preset regardless of selection order', () => {
    const shuffled = [...buildPresetScopes(groups, preset('read-write'))].reverse()

    expect(getActivePresetKey(groups, shuffled)).toBe('read-write')
  })

  test('returns null for a subset of a preset', () => {
    expect(getActivePresetKey(groups, ['control:read'])).toBeNull()
  })

  test('returns null for a preset plus one extra scope', () => {
    expect(getActivePresetKey(groups, [...buildPresetScopes(groups, preset('read-only')), 'control:delete'])).toBeNull()
  })

  test('returns null for a hand-picked mix that matches no preset', () => {
    expect(getActivePresetKey(groups, ['control:write', 'policy:read'])).toBeNull()
  })
})
