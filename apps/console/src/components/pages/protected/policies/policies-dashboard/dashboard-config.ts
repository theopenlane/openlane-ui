import { InternalPolicyDocumentStatus, InternalPolicyWhereInput } from '@repo/codegen/src/schema'

export const wherePoliciesDashboard: InternalPolicyWhereInput = { statusNEQ: InternalPolicyDocumentStatus.ARCHIVED }
