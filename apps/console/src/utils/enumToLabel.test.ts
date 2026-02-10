import { objectToSnakeCase } from './enumToLabel'

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
