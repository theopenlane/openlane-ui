export function objectToSnakeCase(object: string | undefined): string {
  if (!object) return ''
  return object
    .split(/(?=[A-Z])/)
    .join('_')
    .toLowerCase()
}

export const toUpperSnakeCase = (input: string): string => {
  if (!input) return ''
  return input
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

/**
 * Words that should always be fully uppercased regardless of how they appear
 * in the raw input (e.g. api_token → API Token, ssoAuthorization → SSO Authorization)
 */
const ACRONYMS = new Set([
  'api',
  'sso',
  'oauth',
  'id',
  'ids',
  'url',
  'uri',
  'ui',
  'ux',
  'sdk',
  'pat',
  'nda',
  'ip',
  'mfa',
  'totp',
  'dns',
  'uuid',
  'sla',
  'json',
  'csv',
  // compliance frameworks, which show up in doc paths and framework names
  'soc',
  'nist',
  'csf',
  'iso',
  'iec',
  'pci',
  'dss',
  'hipaa',
  'gdpr',
  'ccpa',
  'sox',
  'cmmc',
  'grc',
  'saml',
  'scim',
])

// joining words that stay lowercase in a title unless they lead it
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to'])

const ACRONYM_WITH_NUMBER = /^([a-z]+)(\d+)$/

const humanizeWord = (word: string, index: number): string => {
  const lower = word.toLowerCase()
  if (ACRONYMS.has(lower)) return word.toUpperCase()

  // acronym followed by a version or number: soc2 → SOC 2, iso27001 → ISO 27001
  const numbered = ACRONYM_WITH_NUMBER.exec(lower)
  if (numbered && ACRONYMS.has(numbered[1])) return `${numbered[1].toUpperCase()} ${numbered[2]}`

  if (index > 0 && SMALL_WORDS.has(lower)) return lower

  return word.charAt(0).toUpperCase() + lower.slice(1)
}

export function toHumanLabel(input: string): string {
  if (!input) return ''

  const label = input
    // Replace underscores and dashes with spaces: api_key → api key
    .replace(/[_-]+/g, ' ')
    // Split acronym followed by normal word: APIToken → API Token
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Split lower-to-upper: DomainDelete → Domain Delete
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()

  // Title-case each word, then fully uppercase known acronyms
  return label.split(' ').map(humanizeWord).join(' ')
}

export const isValidDomain = (domain: string): boolean => /^([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain)

export const getEmailDomain = (email?: string | null): string | null => {
  if (!email) return null
  const parts = email.trim().toLowerCase().split('@')
  return parts.length === 2 && parts[1] ? parts[1] : null
}

export function formatPhoneNumber(value?: string | null): string {
  if (!value) return ''

  const digits = value.replace(/\D/g, '')

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  }

  return value
}

// if you change this, update packages/codegen/plugins/lib.js:pluralizeTypeName also
export function pluralizeTypeName(name: string): string {
  const lc = name.charAt(0).toLowerCase() + name.slice(1)
  if (/(?:s|x|z|ch|sh)$/.test(lc)) return lc + 'es'
  if (/[bcdfghjklmnpqrstvwxyz]y$/.test(lc)) return lc.slice(0, -1) + 'ies'
  return lc + 's'
}

// Short prefix for an organization's own ref codes, so a template control
// adopted from OL Baseline reads as theirs: "Acme Corp" -> AC, "Microsoft" -> MI.
// Empty when there is nothing to abbreviate, so callers can keep their default
export const orgAbbreviation = (name?: string | null): string => {
  const words = (name ?? '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)

  if (words.length === 0) return ''
  // a single word has no initials to take, so use its opening letters
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export const pluralize = (count: number, singular: string, plural?: string): string => (count === 1 ? singular : (plural ?? pluralizeTypeName(singular)))

export const pluralizeWithCount = (count: number, singular: string, plural?: string): string => `${count} ${pluralize(count, singular, plural)}`

// lowercased words, punctuation dropped: the shared basis for name matching,
// similarity scoring and word-by-word search filters
export const wordTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
