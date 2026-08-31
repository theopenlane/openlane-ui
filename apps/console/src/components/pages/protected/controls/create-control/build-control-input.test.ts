import { buildControlEntityInput, emptyToUndefined, stripAssociationKeys } from './build-control-input'

describe('stripAssociationKeys', () => {
  it('drops every association key and keeps the rest', () => {
    const result = stripAssociationKeys({ refCode: 'AC-1', policyIDs: ['p1'], status: 'PREPARING' }, new Set(['policyIDs']))

    expect(result).toEqual({ refCode: 'AC-1', status: 'PREPARING' })
  })

  it('returns everything when no key matches', () => {
    expect(stripAssociationKeys({ refCode: 'AC-1' }, new Set(['policyIDs']))).toEqual({ refCode: 'AC-1' })
  })

  it('returns an empty object when every key is an association', () => {
    expect(stripAssociationKeys({ policyIDs: ['p1'], riskIDs: ['r1'] }, new Set(['policyIDs', 'riskIDs']))).toEqual({})
  })
})

describe('emptyToUndefined', () => {
  it('maps an empty string onto undefined so the field is omitted', () => {
    expect(emptyToUndefined('')).toBeUndefined()
  })

  it('maps null onto undefined', () => {
    expect(emptyToUndefined(null)).toBeUndefined()
  })

  it('keeps a real value', () => {
    expect(emptyToUndefined('REF-1')).toBe('REF-1')
  })

  it('keeps zero rather than treating it as empty', () => {
    expect(emptyToUndefined(0)).toBe(0)
  })

  it('keeps false rather than treating it as empty', () => {
    expect(emptyToUndefined(false)).toBe(false)
  })
})

describe('buildControlEntityInput', () => {
  const associationKeys = new Set(['policyIDs', 'riskIDs'])

  it('strips associations and carries the plain fields through', () => {
    const input = buildControlEntityInput({
      data: { refCode: 'AC-1', status: 'PREPARING', policyIDs: ['p1'] },
      associationKeys,
    })

    expect(input.refCode).toBe('AC-1')
    expect(input.status).toBe('PREPARING')
    expect('policyIDs' in input).toBe(false)
  })

  it('sets description and descriptionJSON from the converted values', () => {
    const json = [{ type: 'p', children: [{ text: 'hello' }] }]
    const input = buildControlEntityInput({ data: {}, associationKeys, description: '<p>hello</p>', descriptionJSON: json })

    expect(input.description).toBe('<p>hello</p>')
    expect(input.descriptionJSON).toBe(json)
  })

  it('omits an empty referenceID rather than sending an empty string', () => {
    const input = buildControlEntityInput({ data: { referenceID: '' }, associationKeys })

    expect(input.referenceID).toBeUndefined()
  })

  it('omits an empty auditorReferenceID', () => {
    const input = buildControlEntityInput({ data: { auditorReferenceID: '' }, associationKeys })

    expect(input.auditorReferenceID).toBeUndefined()
  })

  it('keeps both reference ids when they are set', () => {
    const input = buildControlEntityInput({ data: { referenceID: 'REF-1', auditorReferenceID: 'AUD-1' }, associationKeys })

    expect(input.referenceID).toBe('REF-1')
    expect(input.auditorReferenceID).toBe('AUD-1')
  })
})
