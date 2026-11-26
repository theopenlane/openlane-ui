import { type ComponentProps } from 'react'
import { type RelatedControlsCell } from '@/components/shared/crud-base/columns/related-controls-cell'
import { type GenericTablePageConfig } from '@/components/shared/crud-base/page'
import {
  ControlImplementationOrderField,
  type ControlImplementationWhereInput,
  type CreateControlImplementationInput,
  type CreateControlImplementationMutation,
  OrderDirection,
  type UpdateControlImplementationInput,
  type UpdateControlImplementationMutation,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectNames, ObjectTypes } from '@repo/codegen/src/type-names'
import { type ControlImplementationListNode } from '@/lib/graphql-hooks/control-implementation'
import { type TFormData } from '../../controls/tabs/implementation/control-implementation-components/form/use-form-schema'

export type ControlImplementationRow = ControlImplementationListNode & {
  title: string
  controlEdges: NonNullable<ComponentProps<typeof RelatedControlsCell>['controlEdges']>
  subcontrolEdges: NonNullable<ComponentProps<typeof RelatedControlsCell>['subcontrolEdges']>
}

export const objectType = ObjectTypes.CONTROL_IMPLEMENTATION
export const objectName = ObjectNames.CONTROL_IMPLEMENTATION
export const displayName = 'Control Implementation'
export const displayNamePlural = 'Control Implementations'
export const tableKey = TableKeyEnum.CONTROL_IMPLEMENTATION
export const orderFieldEnum = ControlImplementationOrderField
export const defaultSorting = [{ field: ControlImplementationOrderField.updated_at, direction: OrderDirection.DESC }]

export type ControlImplementationTablePageConfig = GenericTablePageConfig<
  ControlImplementationRow,
  TFormData,
  UpdateControlImplementationInput,
  UpdateControlImplementationMutation,
  CreateControlImplementationInput,
  CreateControlImplementationMutation,
  ControlImplementationWhereInput,
  ControlImplementationOrderField
>
