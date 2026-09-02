import { Permission, type User } from '@repo/codegen/src/schema'
import { formatDateTime } from '@/utils/date'
import { type AuthorMaps } from '@/lib/authors'
import { type GroupExportNode } from '@/lib/graphql-hooks/group'
import { AUTHOR_COLUMN_KEYS, getGroupExportColumns } from './export-columns'

const CREATED_AT = '2026-01-09T08:15:00.000Z'
const UPDATED_AT = '2026-02-11T17:45:00.000Z'

const memberEdge = (displayName: string, role: string) => ({ node: { role, user: { displayName } } })

const group = (overrides: Partial<GroupExportNode> = {}): GroupExportNode =>
  ({
    id: 'grp_1',
    displayName: 'Security Team',
    name: 'security-team',
    description: 'Owns the control library',
    tags: ['core', 'security'],
    setting: { visibility: 'PUBLIC' },
    members: { totalCount: 2, edges: [memberEdge('Ada Lovelace', 'ADMIN'), memberEdge('Grace Hopper', 'MEMBER')] },
    createdBy: 'usr_author',
    createdAt: CREATED_AT,
    updatedBy: 'usr_author',
    updatedAt: UPDATED_AT,
    ...overrides,
  }) as unknown as GroupExportNode

const authorMaps: AuthorMaps = { userMap: { usr_author: { id: 'usr_author', displayName: 'Alan Turing' } as User } }

const allVisible = {}

const labels = (columns: ReturnType<typeof getGroupExportColumns>) => columns.map((column) => column.label)

const valueFor = (columns: ReturnType<typeof getGroupExportColumns>, label: string, row: GroupExportNode) => {
  const column = columns.find((candidate) => candidate.label === label)
  if (!column) throw new Error(`no column labelled ${label}`)
  return column.accessor(row)
}

describe('getGroupExportColumns — shape', () => {
  it('exports every table column plus Tags when everything is visible', () => {
    expect(labels(getGroupExportColumns({ columnVisibility: allVisible, authorMaps, includePermissions: false }))).toEqual([
      'ID',
      'Display Name',
      'Name',
      'Description',
      'Visibility',
      'Members',
      'Created by',
      'Created At',
      'Updated By',
      'Last Updated',
      'Tags',
    ])
  })

  it('drops a column the table has hidden', () => {
    const columns = getGroupExportColumns({ columnVisibility: { description: false, updatedAt: false }, authorMaps, includePermissions: false })
    expect(labels(columns)).not.toContain('Description')
    expect(labels(columns)).not.toContain('Last Updated')
    expect(labels(columns)).toContain('Name')
  })

  it('treats a column that is explicitly true as visible', () => {
    expect(labels(getGroupExportColumns({ columnVisibility: { description: true }, authorMaps, includePermissions: false }))).toContain('Description')
  })

  it('appends Permissions only when permissions are requested, and always last', () => {
    const without = labels(getGroupExportColumns({ columnVisibility: allVisible, authorMaps, includePermissions: false }))
    const with_ = labels(getGroupExportColumns({ columnVisibility: allVisible, authorMaps, includePermissions: true }))
    expect(without).not.toContain('Permissions')
    expect(with_.at(-1)).toBe('Permissions')
  })

  it('keeps Tags after the table columns even when columns are hidden', () => {
    expect(labels(getGroupExportColumns({ columnVisibility: { id: false }, authorMaps, includePermissions: false })).at(-1)).toBe('Tags')
  })

  it('names the author columns that drive the author-map fetch', () => {
    expect(AUTHOR_COLUMN_KEYS).toEqual(['createdBy', 'updatedBy'])
  })
})

describe('getGroupExportColumns — values', () => {
  const columns = getGroupExportColumns({ columnVisibility: allVisible, authorMaps, includePermissions: true })

  it('reads the plain group fields', () => {
    expect(valueFor(columns, 'ID', group())).toBe('grp_1')
    expect(valueFor(columns, 'Display Name', group())).toBe('Security Team')
    expect(valueFor(columns, 'Name', group())).toBe('security-team')
  })

  it('renders a null description as an empty cell', () => {
    expect(valueFor(columns, 'Description', group({ description: null } as Partial<GroupExportNode>))).toBe('')
  })

  it('renders visibility through the shared enum labeller', () => {
    expect(valueFor(columns, 'Visibility', group())).toBe('Public')
  })

  it('renders each member as name plus labelled role', () => {
    expect(valueFor(columns, 'Members', group())).toBe('Ada Lovelace (Admin); Grace Hopper (Member)')
  })

  it('marks how many members were omitted when the page is shorter than the total', () => {
    const row = group({ members: { totalCount: 5, edges: [memberEdge('Ada Lovelace', 'ADMIN')] } } as unknown as Partial<GroupExportNode>)
    expect(valueFor(columns, 'Members', row)).toBe('Ada Lovelace (Admin); … +4 more')
  })

  it('does not add an overflow marker when the page holds every member', () => {
    expect(valueFor(columns, 'Members', group())).not.toContain('more')
  })

  it('skips null member edges instead of throwing', () => {
    const row = group({ members: { totalCount: 1, edges: [null, memberEdge('Ada Lovelace', 'ADMIN')] } } as unknown as Partial<GroupExportNode>)
    expect(valueFor(columns, 'Members', row)).toBe('Ada Lovelace (Admin)')
  })

  it('resolves author ids through the author maps', () => {
    expect(valueFor(columns, 'Created by', group())).toBe('Alan Turing')
    expect(valueFor(columns, 'Updated By', group())).toBe('Alan Turing')
  })

  it('formats both timestamps with the shared date formatter', () => {
    expect(valueFor(columns, 'Created At', group())).toBe(formatDateTime(CREATED_AT))
    expect(valueFor(columns, 'Last Updated', group())).toBe(formatDateTime(UPDATED_AT))
  })

  it('joins tags with a semicolon and tolerates null', () => {
    expect(valueFor(columns, 'Tags', group())).toBe('core; security')
    expect(valueFor(columns, 'Tags', group({ tags: null } as Partial<GroupExportNode>))).toBe('')
  })

  it('renders permissions as object type, name and mapped permission label', () => {
    const row = group({
      permissions: { edges: [{ node: { objectType: 'Program', name: 'SOC 2', permissions: Permission.EDITOR } }] },
    } as unknown as Partial<GroupExportNode>)
    expect(valueFor(columns, 'Permissions', row)).toBe('Program: SOC 2 (Edit)')
  })

  it('falls back to Unknown for a permission row with no name', () => {
    const row = group({
      permissions: { edges: [{ node: { objectType: 'Program', name: '', permissions: Permission.VIEWER } }] },
    } as unknown as Partial<GroupExportNode>)
    expect(valueFor(columns, 'Permissions', row)).toBe('Program: Unknown (View)')
  })

  it('renders an empty permissions cell when the group has none', () => {
    expect(valueFor(columns, 'Permissions', group({ permissions: { edges: [] } } as unknown as Partial<GroupExportNode>))).toBe('')
    expect(valueFor(columns, 'Permissions', group())).toBe('')
  })
})
