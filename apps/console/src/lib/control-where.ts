import { type ControlWhereInput, type GroupWhereInput } from '@repo/codegen/src/schema'

export const groupContainsUsersWhere = (userIDs: string[]): GroupWhereInput => ({ hasUsersWith: [{ idIn: userIDs }] })

export const controlOwnedByUsersWhere = (userIDs: string[]): ControlWhereInput => ({ hasControlOwnerWith: [groupContainsUsersWhere(userIDs)] })

export const controlOwnedByUserWhere = (userId: string): ControlWhereInput => controlOwnedByUsersWhere([userId])
