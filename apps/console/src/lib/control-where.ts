import { type ControlWhereInput } from '@repo/codegen/src/schema'

export const controlOwnedByUserWhere = (userId: string): ControlWhereInput => ({
  hasControlOwnerWith: [{ hasMembersWith: [{ userID: userId }] }],
})
