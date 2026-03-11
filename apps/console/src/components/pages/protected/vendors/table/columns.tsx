import { type ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import { type EntitiesNodeNonNull } from '@/lib/graphql-hooks/entity'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'

export const getColumns = ({ userMap, convertToReadOnly, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<EntitiesNodeNonNull>[] => {
  return [
    createSelectColumn<EntitiesNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'name', header: 'Name', size: 120, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'displayName', header: 'Display Name', size: 120 },

    {
      accessorKey: 'description',
      header: 'Description',
      size: 200,
      minSize: 150,
      cell: ({ cell }) => convertToReadOnly?.(cell.getValue() as string) || '',
    },
    { accessorKey: 'domains', header: 'Domains', size: 200, cell: ({ cell }) => (cell.getValue() as string[])?.join(', ') || '' },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ cell }) => {
        const value = cell.getValue() as string
        return <div>{value ? getEnumLabel(value) : '-'}</div>
      },
    },
    { accessorKey: 'tags', header: 'Tags', size: 180, cell: ({ cell }) => (cell.getValue() as string[])?.join(', ') || '' },
    { accessorKey: 'annualSpend', header: 'Annual Spend', size: 120 },
    {
      accessorKey: 'approvedForUse',
      header: 'Approved For Use',
      size: 120,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    {
      accessorKey: 'autoRenews',
      header: 'Auto Renews',
      size: 120,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    { accessorKey: 'billingModel', header: 'Billing Model', size: 120 },
    { accessorKey: 'contractEndDate', header: 'Contract End Date', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'contractRenewalAt', header: 'Contract Renewal At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'contractStartDate', header: 'Contract Start Date', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'entityRelationshipStateName',
      header: 'Relationship State',
      size: 150,
      cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} objectType="entity" field="relationshipState" />,
    },
    {
      accessorKey: 'entitySecurityQuestionnaireStatusName',
      header: 'Security Questionnaire Status',
      size: 180,
      cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} objectType="entity" field="entitySecurityQuestionnaireStatus" />,
    },
    {
      accessorKey: 'entitySourceTypeName',
      header: 'Source Type',
      size: 120,
      cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} objectType="entity" field="entitySourceType" />,
    },
    { accessorKey: 'environmentName', header: 'Environment', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="environment" /> },
    {
      accessorKey: 'hasSoc2',
      header: 'Has SOC 2',
      size: 100,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    { accessorKey: 'internalOwner', header: 'Internal Owner', size: 150 },
    { accessorKey: 'lastReviewedAt', header: 'Last Reviewed At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'mfaEnforced',
      header: 'MFA Enforced',
      size: 100,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    {
      accessorKey: 'mfaSupported',
      header: 'MFA Supported',
      size: 100,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    { accessorKey: 'nextReviewAt', header: 'Next Review At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'renewalRisk', header: 'Renewal Risk', size: 120 },
    { accessorKey: 'reviewedBy', header: 'Reviewed By', size: 120 },
    { accessorKey: 'riskRating', header: 'Risk Rating', size: 120 },
    { accessorKey: 'riskScore', header: 'Risk Score', size: 100 },
    { accessorKey: 'scopeName', header: 'Scope Name', size: 120, cell: ({ cell }) => <CustomEnumChipCell value={cell.getValue() as string} field="scope" /> },
    { accessorKey: 'soc2PeriodEnd', header: 'SOC 2 Period End', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'spendCurrency', header: 'Spend Currency', size: 100 },
    {
      accessorKey: 'ssoEnforced',
      header: 'SSO Enforced',
      size: 100,
      cell: ({ cell }) => <BooleanCell value={cell.getValue() as boolean | null | undefined} />,
    },
    {
      accessorKey: 'statusPageURL',
      header: 'Status Page URL',
      size: 200,
      cell: ({ cell }) => {
        const url = cell.getValue() as string
        return url ? (
          <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {url}
          </a>
        ) : (
          ''
        )
      },
    },
    { accessorKey: 'terminationNoticeDays', header: 'Termination Notice Days', size: 100 },
    { accessorKey: 'tier', header: 'Tier', size: 100 },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
  ]
}
