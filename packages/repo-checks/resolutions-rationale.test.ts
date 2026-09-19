import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ROOT_MANIFEST = fileURLToPath(new URL('../../package.json', import.meta.url))

type RootManifest = {
  resolutions: Record<string, string>
  resolutionsRationale: Record<string, string>
}

const { resolutions, resolutionsRationale } = JSON.parse(readFileSync(ROOT_MANIFEST, 'utf8')) as RootManifest

describe('root package.json resolutions', () => {
  it('documents every pin in resolutionsRationale', () => {
    const undocumented = Object.keys(resolutions).filter((name) => !resolutionsRationale[name])

    expect(undocumented).toEqual([])
  })

  it('has no rationale left behind by a removed pin', () => {
    const orphaned = Object.keys(resolutionsRationale).filter((name) => !resolutions[name])

    expect(orphaned).toEqual([])
  })

  it('explains each pin in enough detail to act on', () => {
    const tooShort = Object.entries(resolutionsRationale)
      .filter(([, rationale]) => rationale.trim().length < 40)
      .map(([name]) => name)

    expect(tooShort).toEqual([])
  })
})
