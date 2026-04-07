import { type GenericTablePageConfig } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig } from '@/components/shared/crud-base/generic-sheet'
import {
  WorkflowDefinitionOrderField,
  type WorkflowDefinitionWhereInput,
  type UpdateWorkflowDefinitionInput,
  type UpdateWorkflowDefinitionMutation,
  type CreateWorkflowDefinitionInput,
  type CreateWorkflowDefinitionMutation,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { type WorkflowDefinitionsNodeNonNull } from '@/lib/graphql-hooks/workflow-definition'

type TFormData = Record<string, never>
type TData = WorkflowDefinitionsNodeNonNull
type TUpdateInput = UpdateWorkflowDefinitionInput
type TUpdateData = UpdateWorkflowDefinitionMutation
type TCreateInput = CreateWorkflowDefinitionInput
type TCreateData = CreateWorkflowDefinitionMutation
type TWhereInput = WorkflowDefinitionWhereInput
type TOrderField = WorkflowDefinitionOrderField

export const objectType = ObjectTypes.WORKFLOW_DEFINITION
export const objectName = ObjectNames.WORKFLOW_DEFINITION
export const tableKey = TableKeyEnum.WORKFLOW_DEFINITION
export const orderFieldEnum = WorkflowDefinitionOrderField
export const defaultSorting = [{ field: WorkflowDefinitionOrderField.updated_at, direction: OrderDirection.DESC }]

export type WorkflowTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type WorkflowSheetConfig = Omit<GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>, 'form' | 'onClose'>
