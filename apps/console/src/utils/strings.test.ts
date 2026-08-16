import { objectToSnakeCase, orgAbbreviation, pluralizeTypeName } from './strings'

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
