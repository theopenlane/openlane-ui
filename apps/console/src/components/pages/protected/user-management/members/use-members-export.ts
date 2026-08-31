'use client'

import { useCallback } from 'react'
import { type OrgMembershipsExportQueryVariables, type OrgMembershipWhereInput } from '@repo/codegen/src/schema'
import { type OrgMembershipExportNode, useFetchAllOrgMembershipsForExport } from '@/lib/graphql-hooks/member'
import { useCsvExport } from '@/components/shared/export/use-csv-export'
import { getMemberExportColumns } from './table/export-columns'

type TUseMembersExportProps = {
  where: OrgMembershipWhereInput
  orderBy: OrgMembershipsExportQueryVariables['orderBy']
  ssoEnforced: boolean
  exemptDomains: string[]
}

export const useMembersExport = ({ where, orderBy, ssoEnforced, exemptDomains }: TUseMembersExportProps) => {
  const fetchAllOrgMemberships = useFetchAllOrgMembershipsForExport()
  const { runExport, isExporting } = useCsvExport<OrgMembershipExportNode>({ fileName: 'members', entityLabel: 'member', entityLabelPlural: 'members' })

  const exportMembers = useCallback(
    () =>
      runExport(async () => ({
        rows: await fetchAllOrgMemberships({ where, orderBy }),
        columns: getMemberExportColumns({ ssoEnforced, exemptDomains }),
      })),
    [runExport, fetchAllOrgMemberships, where, orderBy, ssoEnforced, exemptDomains],
  )

  return { exportMembers, isExporting }
}
