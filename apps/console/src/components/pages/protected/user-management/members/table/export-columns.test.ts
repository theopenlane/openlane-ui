import { OrgMembershipRole, UserAuthProvider } from '@repo/codegen/src/schema'
import { formatDateTime } from '@/utils/date'
import { type OrgMembershipExportNode } from '@/lib/graphql-hooks/member'
import { getMemberExportColumns } from './export-columns'

const CREATED_AT = '2026-03-04T10:30:00.000Z'

const member = (overrides: Partial<OrgMembershipExportNode> = {}): OrgMembershipExportNode =>
  ({
    id: 'om_1',
    role: OrgMembershipRole.MEMBER,
    createdAt: CREATED_AT,
    additionalRoles: [],
    tfaEnforced: false,
    user: { id: 'u_1', displayName: 'Ada Lovelace', email: 'ada@example.com', authProvider: UserAuthProvider.CREDENTIALS },
    ...overrides,
  }) as OrgMembershipExportNode

const labels = (columns: ReturnType<typeof getMemberExportColumns>) => columns.map((column) => column.label)

const valueFor = (columns: ReturnType<typeof getMemberExportColumns>, label: string, row: OrgMembershipExportNode) => {
  const column = columns.find((candidate) => candidate.label === label)
  if (!column) throw new Error(`no column labelled ${label}`)
  return column.accessor(row)
}

describe('getMemberExportColumns — shape', () => {
  it('omits the SSO columns when SSO is not enforced', () => {
    expect(labels(getMemberExportColumns({ ssoEnforced: false, exemptDomains: [] }))).toEqual(['Name', 'Email', 'Role', 'Additional Roles', 'Joined', 'Provider', '2FA', '2FA Reason'])
  })

  it('inserts the SSO columns before the 2FA columns when SSO is enforced', () => {
    expect(labels(getMemberExportColumns({ ssoEnforced: true, exemptDomains: [] }))).toEqual([
      'Name',
      'Email',
      'Role',
      'Additional Roles',
      'Joined',
      'Provider',
      'SSO',
      'SSO Exempt Reason',
      '2FA',
      '2FA Reason',
    ])
  })
})

describe('getMemberExportColumns — values', () => {
  const columns = getMemberExportColumns({ ssoEnforced: true, exemptDomains: ['vendor.io'] })

  it('reads the user fields off the nested user node', () => {
    expect(valueFor(columns, 'Name', member())).toBe('Ada Lovelace')
    expect(valueFor(columns, 'Email', member())).toBe('ada@example.com')
  })

  it('renders the role through the shared enum labeller', () => {
    expect(valueFor(columns, 'Role', member({ role: OrgMembershipRole.SUPER_ADMIN }))).toBe('Super Admin')
  })

  it('renders the auth provider through the shared enum labeller', () => {
    expect(valueFor(columns, 'Provider', member())).toBe('Credentials')
  })

  it('joins additional roles with a semicolon and tolerates null', () => {
    expect(valueFor(columns, 'Additional Roles', member({ additionalRoles: ['Reviewer', 'Approver'] }))).toBe('Reviewer; Approver')
    expect(valueFor(columns, 'Additional Roles', member({ additionalRoles: null }))).toBe('')
  })

  it('formats the join date with the shared date formatter', () => {
    expect(valueFor(columns, 'Joined', member())).toBe(formatDateTime(CREATED_AT))
  })

  it('reports SSO as Exempt with its reason for an exempt-domain member', () => {
    const row = member({ user: { id: 'u_2', displayName: 'Grace', email: 'grace@vendor.io', authProvider: UserAuthProvider.OIDC } } as Partial<OrgMembershipExportNode>)
    expect(valueFor(columns, 'SSO', row)).toBe('Exempt')
    expect(valueFor(columns, 'SSO Exempt Reason', row)).toBe('Exempt via domain (vendor.io)')
  })

  it('reports SSO as Enforced with a blank reason for a non-exempt member', () => {
    expect(valueFor(columns, 'SSO', member())).toBe('Enforced')
    expect(valueFor(columns, 'SSO Exempt Reason', member())).toBe('')
  })

  it('leaves the 2FA reason blank unless 2FA is enforced', () => {
    expect(valueFor(columns, '2FA', member())).toBe('Not enforced')
    expect(valueFor(columns, '2FA Reason', member({ tfaEnforcedReason: 'ignored while not enforced' }))).toBe('')
  })

  it('emits the 2FA reason once 2FA is enforced', () => {
    expect(valueFor(columns, '2FA', member({ tfaEnforced: true }))).toBe('Enforced')
    expect(valueFor(columns, '2FA Reason', member({ tfaEnforced: true, tfaEnforcedReason: 'Handles production data' }))).toBe('Handles production data')
    expect(valueFor(columns, '2FA Reason', member({ tfaEnforced: true }))).toBe('Manually required to configure 2FA')
  })
})
