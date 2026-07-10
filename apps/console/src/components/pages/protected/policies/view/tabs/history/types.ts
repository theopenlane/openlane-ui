import { type GetInternalPolicyHistoriesQuery } from '@repo/codegen/src/historyschema'

export type HistoryNode = NonNullable<NonNullable<NonNullable<GetInternalPolicyHistoriesQuery['internalPolicyHistories']['edges']>[number]>['node']>
