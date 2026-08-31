import { Permission } from '@repo/codegen/src/schema'

export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEWER]: 'View',
  [Permission.EDITOR]: 'Edit',
  [Permission.BLOCKED]: 'Blocked',
  [Permission.CREATOR]: 'Create',
}
