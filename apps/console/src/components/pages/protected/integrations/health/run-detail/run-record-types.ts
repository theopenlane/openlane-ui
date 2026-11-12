import { type GraphQLClient } from 'graphql-request'
import {
  type GetIntegrationRunActionPlansQuery,
  type GetIntegrationRunAssetsQuery,
  type GetIntegrationRunCheckResultsQuery,
  type GetIntegrationRunContactsQuery,
  type GetIntegrationRunDirectoryAccountsQuery,
  type GetIntegrationRunDirectoryGroupsQuery,
  type GetIntegrationRunDirectoryMembershipsQuery,
  type GetIntegrationRunEntitiesQuery,
  type GetIntegrationRunFindingsQuery,
  type GetIntegrationRunInternalPoliciesQuery,
  type GetIntegrationRunProceduresQuery,
  type GetIntegrationRunRisksQuery,
  type GetIntegrationRunVulnerabilitiesQuery,
  type PageInfo,
} from '@repo/codegen/src/schema'
import {
  GET_INTEGRATION_RUN_ACTION_PLANS,
  GET_INTEGRATION_RUN_ASSETS,
  GET_INTEGRATION_RUN_CHECK_RESULTS,
  GET_INTEGRATION_RUN_CONTACTS,
  GET_INTEGRATION_RUN_DIRECTORY_ACCOUNTS,
  GET_INTEGRATION_RUN_DIRECTORY_GROUPS,
  GET_INTEGRATION_RUN_DIRECTORY_MEMBERSHIPS,
  GET_INTEGRATION_RUN_ENTITIES,
  GET_INTEGRATION_RUN_FINDINGS,
  GET_INTEGRATION_RUN_INTERNAL_POLICIES,
  GET_INTEGRATION_RUN_PROCEDURES,
  GET_INTEGRATION_RUN_RISKS,
  GET_INTEGRATION_RUN_VULNERABILITIES,
} from '@repo/codegen/query/integration-health'
import { type TPageInfo, type TPaginationQuery } from '@repo/ui/pagination-types'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { getVulnerabilityTitle } from '@/components/pages/protected/vulnerabilities/vulnerability-display'
import { getNodes, type Edge } from '@/lib/graphql-hooks/connection'
import { type TIntegrationRunDetail } from '@/lib/graphql-hooks/integration-run'
import { vendorDisplayName } from '@/lib/graphql-hooks/entity'

export type TRunRecordRow = {
  id: string
  name: string
  detail: string
  status: string
  updatedAt?: string | null
}

type TRunRecordPage = {
  rows: TRunRecordRow[]
  totalCount: number
  pageInfo?: TPageInfo
}

type TRunRecordVariables = { integrationRunId: string } & TPaginationQuery

type TRunRecordKey = {
  [K in keyof TIntegrationRunDetail]: TIntegrationRunDetail[K] extends { totalCount: number } ? K : never
}[keyof TIntegrationRunDetail]

export type TRunRecordType = {
  key: TRunRecordKey
  label: string
  sheetKind?: ObjectAssociationNodeEnum
  fetchPage: (client: GraphQLClient, variables: TRunRecordVariables) => Promise<TRunRecordPage>
}

export const runRecordCount = (run: TIntegrationRunDetail, type: TRunRecordType): number => run[type.key].totalCount

type TRecordConnection<TNode> = { totalCount: number; pageInfo: PageInfo; edges?: Array<Edge<TNode>> | null }

type TRunRecordDefinition<TQuery, TNode> = Omit<TRunRecordType, 'fetchPage'> & {
  document: string
  connection: (data: TQuery) => TRecordConnection<TNode> | undefined
  toRow: (node: TNode) => TRunRecordRow
}

const defineRunRecordType = <TQuery, TNode>({ document, connection, toRow, ...type }: TRunRecordDefinition<TQuery, TNode>): TRunRecordType => ({
  ...type,
  fetchPage: async (client, variables) => {
    const records = connection(await client.request<TQuery>(document, variables))

    return { rows: getNodes(records).map(toRow), totalCount: records?.totalCount ?? 0, pageInfo: records?.pageInfo }
  },
})

const statusLabel = (status?: string | null): string => (status ? getEnumLabel(status) : '-')

const firstRun = <TNode>(data: { integrationRuns: { edges?: Array<Edge<TNode>> | null } }): TNode | undefined => getNodes(data.integrationRuns)[0]

export const RUN_RECORD_TYPES: TRunRecordType[] = [
  defineRunRecordType({
    key: 'findings',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.FINDING].label,
    sheetKind: ObjectAssociationNodeEnum.FINDING,
    document: GET_INTEGRATION_RUN_FINDINGS,
    connection: (data: GetIntegrationRunFindingsQuery) => firstRun(data)?.findings,
    toRow: (finding) => ({
      id: finding.id,
      name: finding.displayName || finding.externalID || finding.displayID,
      detail: finding.resourceName || finding.category || '-',
      status: finding.severity || '-',
      updatedAt: finding.updatedAt,
    }),
  }),
  defineRunRecordType({
    key: 'vulnerabilities',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.VULNERABILITY].label,
    sheetKind: ObjectAssociationNodeEnum.VULNERABILITY,
    document: GET_INTEGRATION_RUN_VULNERABILITIES,
    connection: (data: GetIntegrationRunVulnerabilitiesQuery) => firstRun(data)?.vulnerabilities,
    toRow: (vulnerability) => ({
      id: vulnerability.id,
      name: getVulnerabilityTitle(vulnerability),
      detail: vulnerability.category || vulnerability.externalID || '-',
      status: vulnerability.severity || '-',
      updatedAt: vulnerability.updatedAt,
    }),
  }),
  defineRunRecordType({
    key: 'assets',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.ASSET].label,
    sheetKind: ObjectAssociationNodeEnum.ASSET,
    document: GET_INTEGRATION_RUN_ASSETS,
    connection: (data: GetIntegrationRunAssetsQuery) => firstRun(data)?.assets,
    toRow: (asset) => ({ id: asset.id, name: asset.displayName || asset.name, detail: asset.identifier || '-', status: statusLabel(asset.assetType), updatedAt: asset.updatedAt }),
  }),
  defineRunRecordType({
    key: 'directoryAccounts',
    label: 'Directory Accounts',
    document: GET_INTEGRATION_RUN_DIRECTORY_ACCOUNTS,
    connection: (data: GetIntegrationRunDirectoryAccountsQuery) => firstRun(data)?.directoryAccounts,
    toRow: (account) => ({
      id: account.id,
      name: account.displayName || account.canonicalEmail || account.externalID,
      detail: account.canonicalEmail || account.externalID,
      status: statusLabel(account.status),
      updatedAt: account.updatedAt,
    }),
  }),
  defineRunRecordType({
    key: 'directoryGroups',
    label: 'Directory Groups',
    document: GET_INTEGRATION_RUN_DIRECTORY_GROUPS,
    connection: (data: GetIntegrationRunDirectoryGroupsQuery) => firstRun(data)?.directoryGroups,
    toRow: (group) => ({
      id: group.id,
      name: group.displayName || group.email || group.externalID,
      detail: group.email || group.externalID,
      status: statusLabel(group.status),
      updatedAt: group.updatedAt,
    }),
  }),
  defineRunRecordType({
    key: 'directoryMemberships',
    label: 'Directory Memberships',
    document: GET_INTEGRATION_RUN_DIRECTORY_MEMBERSHIPS,
    connection: (data: GetIntegrationRunDirectoryMembershipsQuery) => firstRun(data)?.directoryMemberships,
    toRow: (membership) => ({
      id: membership.id,
      name: membership.directoryAccount.displayName || membership.directoryAccount.canonicalEmail || membership.displayID,
      detail: membership.directoryGroup.displayName || '-',
      status: statusLabel(membership.role),
      updatedAt: membership.updatedAt,
    }),
  }),
  defineRunRecordType({
    key: 'entities',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.ENTITY].label,
    sheetKind: ObjectAssociationNodeEnum.ENTITY,
    document: GET_INTEGRATION_RUN_ENTITIES,
    connection: (data: GetIntegrationRunEntitiesQuery) => firstRun(data)?.entities,
    toRow: (entity) => ({ id: entity.id, name: vendorDisplayName(entity), detail: entity.name || '-', status: statusLabel(entity.status), updatedAt: entity.updatedAt }),
  }),
  defineRunRecordType({
    key: 'contacts',
    label: 'Contacts',
    sheetKind: ObjectAssociationNodeEnum.CONTACT,
    document: GET_INTEGRATION_RUN_CONTACTS,
    connection: (data: GetIntegrationRunContactsQuery) => firstRun(data)?.contacts,
    toRow: (contact) => ({ id: contact.id, name: contact.fullName || contact.email || contact.id, detail: contact.email || '-', status: statusLabel(contact.status), updatedAt: contact.updatedAt }),
  }),
  defineRunRecordType({
    key: 'risks',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.RISKS].label,
    sheetKind: ObjectAssociationNodeEnum.RISKS,
    document: GET_INTEGRATION_RUN_RISKS,
    connection: (data: GetIntegrationRunRisksQuery) => firstRun(data)?.risks,
    toRow: (risk) => ({ id: risk.id, name: risk.name, detail: risk.displayID, status: statusLabel(risk.status), updatedAt: risk.updatedAt }),
  }),
  defineRunRecordType({
    key: 'internalPolicies',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.POLICY].label,
    sheetKind: ObjectAssociationNodeEnum.POLICY,
    document: GET_INTEGRATION_RUN_INTERNAL_POLICIES,
    connection: (data: GetIntegrationRunInternalPoliciesQuery) => firstRun(data)?.internalPolicies,
    toRow: (policy) => ({ id: policy.id, name: policy.name, detail: policy.displayID, status: statusLabel(policy.status), updatedAt: policy.updatedAt }),
  }),
  defineRunRecordType({
    key: 'procedures',
    label: ObjectAssociationMap[ObjectAssociationNodeEnum.PROCEDURE].label,
    sheetKind: ObjectAssociationNodeEnum.PROCEDURE,
    document: GET_INTEGRATION_RUN_PROCEDURES,
    connection: (data: GetIntegrationRunProceduresQuery) => firstRun(data)?.procedures,
    toRow: (procedure) => ({ id: procedure.id, name: procedure.name, detail: procedure.displayID, status: statusLabel(procedure.status), updatedAt: procedure.updatedAt }),
  }),
  defineRunRecordType({
    key: 'actionPlans',
    label: ObjectAssociationMap.actionPlans.label,
    document: GET_INTEGRATION_RUN_ACTION_PLANS,
    connection: (data: GetIntegrationRunActionPlansQuery) => firstRun(data)?.actionPlans,
    toRow: (plan) => ({ id: plan.id, name: plan.name, detail: plan.externalID || '-', status: statusLabel(plan.status), updatedAt: plan.updatedAt }),
  }),
  defineRunRecordType({
    key: 'checkResults',
    label: 'Check Results',
    document: GET_INTEGRATION_RUN_CHECK_RESULTS,
    connection: (data: GetIntegrationRunCheckResultsQuery) => firstRun(data)?.checkResults,
    toRow: (check) => ({ id: check.id, name: check.sourceKey || check.source, detail: check.source, status: statusLabel(check.status), updatedAt: check.updatedAt }),
  }),
]
