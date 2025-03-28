import { GroupOrderField } from '@repo/codegen/src/schema.ts'

export const GROUP_SORT_FIELDS: { key: GroupOrderField; label: string }[] = [
  { key: GroupOrderField.created_at, label: 'Created At' },
  { key: GroupOrderField.updated_at, label: 'Updated At' },
  { key: GroupOrderField.display_name, label: 'Display Name' },
  { key: GroupOrderField.name, label: 'Name' },
]
