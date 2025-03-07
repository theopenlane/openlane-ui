import { User } from '@repo/codegen/src/schema'

export type TTableDataResponse = {
  displayID?: string
  id?: number
  title?: string
  details?: string
  status?: string
  due?: string
  assigner?: User
  category?: string
}
