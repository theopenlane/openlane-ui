import { type TaskWhereInput } from '@repo/codegen/src/schema'
import { mergeWhere } from '@/lib/merge-where'
import { whereContainsKey } from '@/components/shared/table-filter/where-generator'

export const EXCLUDE_TEMPLATES_WHERE = { isTemplate: false } as const satisfies TaskWhereInput

export const resolveTasksWhere = (where: TaskWhereInput | null | undefined, includeTemplates?: boolean): TaskWhereInput =>
  mergeWhere<TaskWhereInput>([where, (includeTemplates ?? whereContainsKey(where, 'isTemplate')) ? undefined : EXCLUDE_TEMPLATES_WHERE])
