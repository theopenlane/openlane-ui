import { wordTokens, objectToSnakeCase, orgAbbreviation, pluralizeTypeName, isValidDomain, getEmailDomain, toHumanLabel, pluralize, pluralizeWithCount } from './strings'

describe('objectToSnakeCase', () => {
  it('should convert camelCase to snake_case', () => {
    expect(objectToSnakeCase('camelCase')).toBe('camel_case')
  })

  it('should convert PascalCase to snake_case', () => {
    expect(objectToSnakeCase('PascalCase')).toBe('pascal_case')
  })

  it('should handle single word', () => {
    expect(objectToSnakeCase('word')).toBe('word')
  })

  it('should handle empty string', () => {
    expect(objectToSnakeCase('')).toBe('')
  })

  it('should handle consecutive uppercase letters', () => {
    expect(objectToSnakeCase('HTMLParser')).toBe('h_t_m_l_parser')
  })

  it('should handle already snake_case', () => {
    expect(objectToSnakeCase('snake_case')).toBe('snake_case')
  })
})

describe('pluralizeTypeName', () => {
  it('should convert consonant+y endings to ies', () => {
    expect(pluralizeTypeName('Policy')).toBe('policies')
  })

  it('should keep vowel+y endings as ys', () => {
    expect(pluralizeTypeName('Survey')).toBe('surveys')
  })

  it('should use es for ch/sh/s/x/z endings', () => {
    expect(pluralizeTypeName('Process')).toBe('processes')
    expect(pluralizeTypeName('Watch')).toBe('watches')
  })

  it('should add s for default cases', () => {
    expect(pluralizeTypeName('Control')).toBe('controls')
  })

  it('should lowercase the first character', () => {
    expect(pluralizeTypeName('Policy')).toMatch(/^[a-z]/)
  })
})

describe('orgAbbreviation', () => {
  it('takes initials from a multi word name', () => {
    expect(orgAbbreviation('Acme Corp')).toBe('AC')
  })

  it('uses the opening letters of a single word name', () => {
    expect(orgAbbreviation('Microsoft')).toBe('MI')
  })

  it('caps initials at three', () => {
    expect(orgAbbreviation('Acme Widget Manufacturing Company')).toBe('AWM')
  })

  it('ignores punctuation between words', () => {
    expect(orgAbbreviation('Acme, Inc.')).toBe('AI')
  })

  it('keeps digits that start a name', () => {
    expect(orgAbbreviation('3M')).toBe('3M')
  })

  it('is empty when there is nothing to abbreviate', () => {
    expect(orgAbbreviation('')).toBe('')
    expect(orgAbbreviation(null)).toBe('')
    expect(orgAbbreviation('   ')).toBe('')
  })
})

describe('wordTokens', () => {
  it('lowercases and splits on punctuation', () => {
    expect(wordTokens('Business Continuity (BC/DR)')).toEqual(['business', 'continuity', 'bc', 'dr'])
  })

  it('drops empty segments', () => {
    expect(wordTokens('  Access--Control  ')).toEqual(['access', 'control'])
  })

  it('returns nothing for a string with no word characters', () => {
    expect(wordTokens('— / —')).toEqual([])
  })
})

/**
 * isValidDomain gates both the SSO exempt-domain list and the allowed-domains editor. It must reject anything
 * that is not a bare registrable domain: no scheme, no path, no port, no bare hostname, and a TLD of at least
 * two letters.
 */
describe('isValidDomain', () => {
  it.each(['acme.com', 'sub.acme.com', 'deep.sub.acme.co.uk', 'a-b.example.io', 'x1.example.dev'])('accepts %s', (domain) => {
    expect(isValidDomain(domain)).toBe(true)
  })

  it.each([
    ['an empty string', ''],
    ['a bare hostname with no dot', 'localhost'],
    ['a scheme', 'https://acme.com'],
    ['a path', 'acme.com/login'],
    ['a port', 'acme.com:8080'],
    ['a leading dot', '.acme.com'],
    ['a trailing dot', 'acme.com.'],
    ['a leading hyphen in a label', '-acme.com'],
    ['a trailing hyphen in a label', 'acme-.com'],
    ['a single-letter TLD', 'acme.c'],
    ['a numeric TLD', 'acme.12'],
    ['an email address', 'user@acme.com'],
    ['whitespace', 'acme .com'],
    ['an underscore', 'ac_me.com'],
  ])('rejects %s', (_label, domain) => {
    expect(isValidDomain(domain)).toBe(false)
  })
})

/**
 * Contact/vendor linking suggests vendors whose domain matches the contact's email domain, so getEmailDomain
 * has to be strict. A wrong answer surfaces as bogus vendor suggestions rather than an error.
 */
describe('getEmailDomain', () => {
  it('extracts and normalises the domain', () => {
    expect(getEmailDomain('User@Acme.COM')).toBe('acme.com')
    expect(getEmailDomain('  user@acme.com  ')).toBe('acme.com')
  })

  it('handles a subdomain host', () => {
    expect(getEmailDomain('user@mail.acme.co.uk')).toBe('mail.acme.co.uk')
  })

  it('returns null for empty input', () => {
    expect(getEmailDomain(undefined)).toBeNull()
    expect(getEmailDomain(null)).toBeNull()
    expect(getEmailDomain('')).toBeNull()
  })

  it('returns null when there is no single @ separator', () => {
    expect(getEmailDomain('user')).toBeNull()
    expect(getEmailDomain('user@acme@com')).toBeNull()
  })

  it('returns null when the host side is empty', () => {
    expect(getEmailDomain('user@')).toBeNull()
  })

  it('returns the host even when the local part is empty', () => {
    // Not a valid address, but the split still yields a usable domain; the caller validates the address
    // separately.
    expect(getEmailDomain('@acme.com')).toBe('acme.com')
  })
})

/**
 * toHumanLabel turns identifiers into display text, keeping a known acronym set uppercase; the scan UI added
 * DNS to that set. This is for camelCase / snake_case identifiers, not ALL_CAPS enums, which go through
 * getEnumLabel.
 */
describe('toHumanLabel', () => {
  it('returns an empty string for empty input', () => {
    expect(toHumanLabel('')).toBe('')
  })

  it('splits snake_case and kebab-case', () => {
    expect(toHumanLabel('domain_scan')).toBe('Domain Scan')
    expect(toHumanLabel('domain-scan')).toBe('Domain Scan')
  })

  it('splits camelCase and PascalCase', () => {
    expect(toHumanLabel('domainDelete')).toBe('Domain Delete')
    expect(toHumanLabel('DomainDelete')).toBe('Domain Delete')
  })

  it('separates a leading acronym from the following word', () => {
    expect(toHumanLabel('APIToken')).toBe('API Token')
  })

  it.each(['api', 'sso', 'oauth', 'url', 'sdk', 'nda', 'mfa', 'totp', 'dns'])('uppercases the %s acronym', (acronym) => {
    expect(toHumanLabel(`${acronym}_scan`)).toBe(`${acronym.toUpperCase()} Scan`)
  })

  it('uppercases DNS specifically, which the scan UI added', () => {
    expect(toHumanLabel('dns_record')).toBe('DNS Record')
  })

  it('title-cases non-acronym words and collapses extra whitespace', () => {
    expect(toHumanLabel('  vendor   RISK  review ')).toBe('Vendor Risk Review')
  })
})

/**
 * pluralize/pluralizeWithCount back the assessment UI's count labels. Only a count of exactly 1 is singular;
 * 0 and negatives take the plural, which is what an "0 responses" label depends on.
 */
describe('pluralize', () => {
  it('is singular only for exactly one', () => {
    expect(pluralize(1, 'response')).toBe('response')
  })

  it('is plural for zero and for many', () => {
    expect(pluralize(0, 'response')).toBe('responses')
    expect(pluralize(2, 'response')).toBe('responses')
  })

  it('honours an explicit plural form', () => {
    expect(pluralize(2, 'person', 'people')).toBe('people')
    expect(pluralize(1, 'person', 'people')).toBe('person')
  })
})

describe('pluralizeWithCount', () => {
  it('prefixes the count', () => {
    expect(pluralizeWithCount(0, 'response')).toBe('0 responses')
    expect(pluralizeWithCount(1, 'response')).toBe('1 response')
    expect(pluralizeWithCount(3, 'response')).toBe('3 responses')
  })

  it('honours an explicit plural form', () => {
    expect(pluralizeWithCount(2, 'person', 'people')).toBe('2 people')
  })
})
