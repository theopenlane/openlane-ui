import { whereContainsKey, whereGenerator } from './where-generator'

type Where = {
  and?: Where[] | null
  or?: Where[] | null
  displayNameContainsFold?: string
  statusIn?: string[] | null
  open?: boolean
  hasControls?: boolean
  hasProgramsWith?: { idIn: string[] }[]
}

const passThrough = (key: string, value: unknown) => ({ [key]: value }) as Where

describe('whereGenerator', () => {
  test('returns an empty object for null input', () => {
    expect(whereGenerator<Where>(null, passThrough)).toEqual({})
  })

  test('merges each mapped key into a single object', () => {
    expect(whereGenerator<Where>({ displayNameContainsFold: 'acme', statusIn: ['ACTIVE'] }, passThrough)).toEqual({ displayNameContainsFold: 'acme', statusIn: ['ACTIVE'] })
  })

  test('lets the mapper rename a key', () => {
    const rename = (key: string, value: unknown) => (key === 'statusIn' ? ({ hasControls: true } as Where) : ({ [key]: value } as Where))
    expect(whereGenerator<Where>({ statusIn: ['ACTIVE'] }, rename)).toEqual({ hasControls: true })
  })

  test('lets the mapper drop a key by returning nothing', () => {
    const drop = (key: string, value: unknown) => (key === 'statusIn' ? ({} as Where) : ({ [key]: value } as Where))
    expect(whereGenerator<Where>({ statusIn: ['ACTIVE'], open: true }, drop)).toEqual({ open: true })
  })

  test('maps every entry of an `and` array through the mapper', () => {
    const result = whereGenerator<Where>({ and: [{ displayNameContainsFold: 'acme' }, { statusIn: ['ACTIVE'] }] }, passThrough)
    expect(result).toEqual({ and: [{ displayNameContainsFold: 'acme' }, { statusIn: ['ACTIVE'] }] })
  })

  test('maps every entry of an `or` array through the mapper', () => {
    const result = whereGenerator<Where>({ or: [{ open: true }] }, passThrough)
    expect(result).toEqual({ or: [{ open: true }] })
  })

  test('merges multiple keys inside one `and` entry into a single condition', () => {
    const result = whereGenerator<Where>({ and: [{ displayNameContainsFold: 'acme', open: true }] }, passThrough)
    expect(result).toEqual({ and: [{ displayNameContainsFold: 'acme', open: true }] })
  })

  test('preserves a `false` nested inside `and`', () => {
    expect(whereGenerator<Where>({ and: [{ open: false }] }, passThrough)).toEqual({ and: [{ open: false }] })
  })

  test('drops a `false`, null or empty string at the top level', () => {
    expect(whereGenerator<Where>({ open: false, displayNameContainsFold: '', statusIn: null }, passThrough)).toEqual({})
  })

  test('keeps an empty `and` array as an empty array', () => {
    expect(whereGenerator<Where>({ and: [] }, passThrough)).toEqual({ and: [] })
  })
})

describe('whereContainsKey', () => {
  test('finds a key at the top level', () => {
    expect(whereContainsKey<Where>({ open: true }, 'open')).toBe(true)
  })

  test('finds a key nested in `and` or `or`', () => {
    expect(whereContainsKey<Where>({ and: [{ or: [{ open: true }] }] }, 'open')).toBe(true)
  })

  test('reports a missing key and tolerates an absent where', () => {
    expect(whereContainsKey<Where>({ and: [{ statusIn: ['ACTIVE'] }] }, 'open')).toBe(false)
    expect(whereContainsKey<Where>(null, 'open')).toBe(false)
    expect(whereContainsKey<Where>(undefined, 'open')).toBe(false)
  })
})
