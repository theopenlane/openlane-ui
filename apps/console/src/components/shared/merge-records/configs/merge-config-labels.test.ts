import { assetMergeConfig, getAssetLabel } from './asset-merge-config'
import { contactMergeConfig } from './contact-merge-config'
import { personnelMergeConfig } from './personnel-merge-config'
import { vendorMergeConfig } from './vendor-merge-config'

/**
 * The merge dialog must name both records, or the confirmation reads "Merge into " and the user cannot tell
 * which record they are about to destroy. The fallback chain ends at the id.
 */

const configs = [
  ['asset', assetMergeConfig],
  ['contact', contactMergeConfig],
  ['personnel', personnelMergeConfig],
  ['vendor', vendorMergeConfig],
] as const

describe('getAssetLabel fallback chain', () => {
  test('prefers the display name', () => {
    expect(getAssetLabel({ id: 'a-1', name: 'raw-name', displayName: 'Pretty Name' })).toBe('Pretty Name')
  })

  test('falls back to the name when there is no display name', () => {
    expect(getAssetLabel({ id: 'a-1', name: 'raw-name', displayName: '' })).toBe('raw-name')
  })

  test('falls back to the id when both names are empty', () => {
    // Ugly but unambiguous — better than an empty label in a destructive dialog.
    expect(getAssetLabel({ id: 'a-1', name: '', displayName: '' })).toBe('a-1')
  })
})

describe('merge configs', () => {
  test.each(configs)('%s config declares its entity type and labels', (_name, config) => {
    expect(config.entityType).toBeTruthy()
    expect(config.labelSingular).toBeTruthy()
    expect(config.labelPlural).toBeTruthy()
  })

  test.each(configs)('%s config never yields an empty label for a record with an id', (_name, config) => {
    // getDisplayName is optional on MergeConfig; where a config supplies one it must still produce something
    // for a record with nothing but an id.
    const label = config.getDisplayName?.({ id: 'record-id' } as never)

    if (config.getDisplayName) expect(label).toBeTruthy()
  })

  test('every config targets a distinct entity type', () => {
    const types = configs.map(([, config]) => config.entityType)

    expect(new Set(types).size).toBe(types.length)
  })

  test('singular and plural labels differ', () => {
    for (const [, config] of configs) {
      expect(config.labelSingular).not.toBe(config.labelPlural)
    }
  })
})
