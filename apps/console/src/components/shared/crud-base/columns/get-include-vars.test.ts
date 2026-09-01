import { type ColumnDef, type VisibilityState } from '@repo/ui/table-types'
import { getIncludeVars } from './get-include-vars'

/**
 * Folds each column's meta.gqlInclude against the table's VisibilityState into the include* query variables.
 * The OR-fold matters: two columns can share a key, and the field must still be fetched while either one is
 * visible.
 */

type Row = { id: string }

const column = (accessorKey: string, gqlInclude?: string[]): ColumnDef<Row> => ({ accessorKey, meta: gqlInclude ? { gqlInclude } : undefined }) as ColumnDef<Row>

describe('getIncludeVars', () => {
  test('returns nothing when no column declares an include key', () => {
    expect(getIncludeVars<Row>([column('refCode'), column('status')], {})).toEqual({})
  })

  test('treats a column absent from the visibility map as visible', () => {
    // getInitialVisibility only lists HIDDEN columns, so "not present" means on.
    expect(getIncludeVars<Row>([column('description', ['includeDescription'])], {})).toEqual({ includeDescription: true })
  })

  test('drops the include key when the column is explicitly hidden', () => {
    expect(getIncludeVars<Row>([column('description', ['includeDescription'])], { description: false })).toEqual({ includeDescription: false })
  })

  test('maps a multi-key column to every key it declares', () => {
    const columns = [column('description', ['includeDescription', 'includeCategory', 'includeSubcategory'])]

    expect(getIncludeVars<Row>(columns, {})).toEqual({
      includeDescription: true,
      includeCategory: true,
      includeSubcategory: true,
    })
  })

  test('ORs a shared key so it survives while any owning column is visible', () => {
    const columns = [column('description', ['includeCategory']), column('category', ['includeCategory'])]

    expect(getIncludeVars<Row>(columns, { description: false })).toEqual({ includeCategory: true })
    expect(getIncludeVars<Row>(columns, { category: false })).toEqual({ includeCategory: true })
    expect(getIncludeVars<Row>(columns, { description: false, category: false })).toEqual({ includeCategory: false })
  })

  test('resolves visibility by column id when there is no accessorKey', () => {
    const columns = [{ id: 'mappedControls', meta: { gqlInclude: ['includeRelatedControls'] } } as ColumnDef<Row>]

    expect(getIncludeVars<Row>(columns, {})).toEqual({ includeRelatedControls: true })
    expect(getIncludeVars<Row>(columns, { mappedControls: false })).toEqual({ includeRelatedControls: false })
  })

  test('ignores an empty gqlInclude list', () => {
    const columns = [{ accessorKey: 'refCode', meta: { gqlInclude: [] } } as unknown as ColumnDef<Row>]

    expect(getIncludeVars<Row>(columns, {})).toEqual({})
  })

  test('folds a realistic mixed column set', () => {
    const columns = [
      column('refCode', ['includeReferenceID']),
      column('description', ['includeDescription']),
      column('status', ['includeStatus']),
      column('risks', ['includeRisks']),
      column('programs', ['includePrograms']),
    ]
    const visibility: VisibilityState = { risks: false, programs: false }

    expect(getIncludeVars<Row>(columns, visibility)).toEqual({
      includeReferenceID: true,
      includeDescription: true,
      includeStatus: true,
      includeRisks: false,
      includePrograms: false,
    })
  })
})
