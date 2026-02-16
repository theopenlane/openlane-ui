import { objectToSnakeCase, pluralizeTypeName } from './strings'

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
