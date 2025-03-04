import { User } from '@repo/codegen/src/schema'

export type TTableDataResponse = {
  displayID?: string
  id?: number
  title?: string
  description?: string
  status?: string
  due?: string
  assigner?: User
  category?: string
}
