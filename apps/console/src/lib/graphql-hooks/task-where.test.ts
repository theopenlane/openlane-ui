import { type TaskWhereInput } from '@repo/codegen/src/schema'
import { EXCLUDE_TEMPLATES_WHERE, resolveTasksWhere } from './task-where'

/**
 * Task templates are stored as tasks with isTemplate:true, so ordinary queries have to exclude them. The
 * exclusion backs off when the caller already constrains isTemplate anywhere in its filter, including inside
 * a nested and/or.
 */
describe('resolveTasksWhere', () => {
  test('excludes templates when there is no filter at all', () => {
    expect(resolveTasksWhere(null)).toEqual(EXCLUDE_TEMPLATES_WHERE)
    expect(resolveTasksWhere(undefined)).toEqual(EXCLUDE_TEMPLATES_WHERE)
  })

  test('excludes templates alongside an unrelated filter', () => {
    const resolved = resolveTasksWhere({ titleContainsFold: 'audit' })

    expect(resolved.and).toEqual([{ titleContainsFold: 'audit' }, EXCLUDE_TEMPLATES_WHERE])
  })

  test('drops the exclusion when the caller asks for templates explicitly', () => {
    expect(resolveTasksWhere(null, true)).toEqual({})
  })

  test('keeps the caller filter untouched when templates are requested', () => {
    expect(resolveTasksWhere({ titleContainsFold: 'audit' }, true)).toEqual({ titleContainsFold: 'audit' })
  })

  test('backs off when the caller already constrains isTemplate', () => {
    // Otherwise the default would AND isTemplate:false onto isTemplate:true and the template picker would
    // return nothing.
    expect(resolveTasksWhere({ isTemplate: true })).toEqual({ isTemplate: true })
  })

  test('backs off for an isTemplate constraint nested in an and-group', () => {
    const where: TaskWhereInput = { and: [{ isTemplate: true }] }

    expect(resolveTasksWhere(where)).toEqual(where)
  })

  test('backs off for an isTemplate constraint nested in an or-group', () => {
    const where: TaskWhereInput = { or: [{ isTemplate: true }, { isTemplate: false }] }

    expect(resolveTasksWhere(where)).toEqual(where)
  })

  test('an explicit includeTemplates:false still excludes templates', () => {
    expect(resolveTasksWhere({ titleContainsFold: 'audit' }, false).and).toEqual([{ titleContainsFold: 'audit' }, EXCLUDE_TEMPLATES_WHERE])
  })

  test('includeTemplates wins over an existing isTemplate constraint', () => {
    expect(resolveTasksWhere({ isTemplate: false }, true)).toEqual({ isTemplate: false })
  })
})
