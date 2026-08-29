import { getProgramFilterFields } from './program-filter-field'

/**
 * Browse-by links wrote filter state whose keys did not match the declared filter fields, so loadFilters
 * silently dropped them. A user without program access gets no field at all rather than an empty-optioned
 * one.
 */
describe('getProgramFilterFields', () => {
  const options = [
    { value: 'p-1', label: 'SOC 2' },
    { value: 'p-2', label: 'ISO 27001' },
  ]

  test('returns nothing when the user has no program access', () => {
    expect(getProgramFilterFields(options, false)).toEqual([])
  })

  test('returns a single multiselect field keyed on hasProgramsWith', () => {
    const [field] = getProgramFilterFields(options, true)

    expect(field).toMatchObject({ key: 'hasProgramsWith', type: 'multiselect', label: 'Program Name' })
  })

  test('passes the program options straight through', () => {
    expect(getProgramFilterFields(options, true)[0].options).toEqual(options)
  })

  test('honours a custom label', () => {
    expect(getProgramFilterFields(options, true, 'Program')[0].label).toBe('Program')
  })

  test('still returns the field when there are no program options', () => {
    // Access, not option count, decides whether the control is offered.
    const fields = getProgramFilterFields([], true)

    expect(fields).toHaveLength(1)
    expect(fields[0].options).toEqual([])
  })

  test('always uses the same key so written filter state survives validation', () => {
    // loadFilters drops keys that are not declared filter fields; a mismatch here is exactly what silently
    // broke the browse-by links.
    for (const label of ['Program Name', 'Program', 'Programs']) {
      expect(getProgramFilterFields(options, true, label)[0].key).toBe('hasProgramsWith')
    }
  })
})
