import { coverageNote, namesMatch, normalizeName, policyCovers } from './names'

describe('normalizeName', () => {
  it('collapses punctuation to single spaces', () => {
    expect(normalizeName('Access-Control  Policy!')).toBe('access control policy')
  })
})

describe('namesMatch', () => {
  it('matches names that differ only by a generic document word', () => {
    expect(namesMatch('Access Control', 'Access Control Policy')).toBe(true)
  })

  it('matches across the stem of a shared word', () => {
    expect(namesMatch('Log Management', 'Logging and Monitoring')).toBe(true)
  })

  it('matches a broader name against the narrower one it covers', () => {
    expect(namesMatch('Business Continuity Plan', 'Business Continuity and Disaster Recovery')).toBe(true)
  })

  it('does not match names that only share half their identifying words', () => {
    expect(namesMatch('Access Control Policy', 'Access Review Policy')).toBe(false)
  })

  it('does not match unrelated policies', () => {
    expect(namesMatch('Incident Response Policy', 'Vendor Management Policy')).toBe(false)
  })

  it('returns false when a name carries no identifying words', () => {
    expect(namesMatch('Policy', 'Incident Response')).toBe(false)
  })
})

describe('policyCovers', () => {
  const physicalSecurity = { name: 'Physical Security', description: 'Controls access to offices, server rooms and other facilities, including badges, visitor logs and secure disposal of equipment' }

  it('covers by name when the titles line up', () => {
    expect(policyCovers({ name: 'Physical Security Policy' }, physicalSecurity)).toBe(true)
  })

  it('covers by content when the titles do not', () => {
    const office = {
      name: 'Office Security',
      summary: 'How the company secures its offices and facilities: badge access to server rooms, visitor logs, and secure disposal of equipment',
    }
    expect(policyCovers(office, physicalSecurity)).toBe(true)
  })

  it('does not cover an unrelated policy with a summary', () => {
    const vendor = { name: 'Vendor Management', summary: 'How the company reviews third party suppliers, their contracts and their annual risk assessments' }
    expect(policyCovers(vendor, physicalSecurity)).toBe(false)
  })

  it('falls back to name matching when there is no summary', () => {
    expect(policyCovers({ name: 'Office Security' }, physicalSecurity)).toBe(false)
  })

  it('covers a bare topic name when the summary speaks to all of it', () => {
    const office = { name: 'Office Security', summary: 'Covers the physical security of our offices, including badge access, visitor logs and server room entry' }
    expect(policyCovers(office, { name: 'Physical Security' })).toBe(true)
  })

  it('does not cover a bare topic name on one shared word', () => {
    const data = { name: 'Data Protection', summary: 'How the company classifies data and applies security controls to it in transit and at rest' }
    expect(policyCovers(data, { name: 'Physical Security' })).toBe(false)
  })
})

describe('coverageNote', () => {
  it('names the topic when the policy is called something else', () => {
    expect(coverageNote('Office Security', 'Physical Security')).toBe('covers Physical Security')
  })

  it('says nothing when the names already read the same', () => {
    expect(coverageNote('Access Control Policy', 'Access Control')).toBeUndefined()
  })
})
