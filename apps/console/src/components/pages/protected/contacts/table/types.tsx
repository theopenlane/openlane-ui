import { type GenericTablePageConfig } from '@/components/shared/crud-base/page'
import { type GenericDetailsSheetConfig, type RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import {
  ContactOrderField,
  type ContactWhereInput,
  type CreateContactInput,
  type CreateContactMutation,
  type UpdateContactInput,
  type UpdateContactMutation,
  ExportExportType,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { type ContactsNodeNonNull } from '@/lib/graphql-hooks/contact'
import { type ContactFormData } from '../hooks/use-form-schema'

type TFormData = ContactFormData
type TData = ContactsNodeNonNull
type TUpdateInput = UpdateContactInput
type TUpdateData = UpdateContactMutation
type TCreateInput = CreateContactInput
type TCreateData = CreateContactMutation
type TWhereInput = ContactWhereInput
type TOrderField = ContactOrderField

export const objectType = ObjectTypes.CONTACT
export const objectName = ObjectNames.CONTACT
export const tableKey = TableKeyEnum.CONTACT
export const exportType = ExportExportType.CONTACT
export const orderFieldEnum = ContactOrderField
export const defaultSorting = [{ field: ContactOrderField.full_name, direction: OrderDirection.ASC }]

type ContactEnumKeys = 'statusOptions' | 'tagOptions'

export type EnumOptions = Record<ContactEnumKeys, { value: string; label: string }[]>

export type ContactTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type ContactSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type ContactFieldProps = RenderFieldsProps<TData, TUpdateInput>

export type { EnumCreateHandlers } from '@/components/shared/crud-base/page'
