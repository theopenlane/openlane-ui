import { GenericTablePageConfig, EnumOptionsGeneric } from '@/components/shared/crud-base/page'
import { GenericDetailsSheetConfig, RenderFieldsProps } from '@/components/shared/crud-base/generic-sheet'

import { ReviewOrderField, ReviewWhereInput, CreateReviewInput, CreateReviewMutation, UpdateReviewInput, UpdateReviewMutation, ExportExportType, OrderDirection } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes, ObjectNames } from '@repo/codegen/src/type-names'
import { ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { ReviewFormData } from '../hooks/use-form-schema'

type TFormData = ReviewFormData
type TData = ReviewsNodeNonNull
type TUpdateInput = UpdateReviewInput
type TUpdateData = UpdateReviewMutation
type TCreateInput = CreateReviewInput
type TCreateData = CreateReviewMutation
type TWhereInput = ReviewWhereInput
type TOrderField = ReviewOrderField

export const objectType = ObjectTypes.REVIEW
export const objectName = ObjectNames.REVIEW
export const tableKey = TableKeyEnum.REVIEW
export const exportType = ExportExportType.REVIEW
export const orderFieldEnum = ReviewOrderField
export const defaultSorting = [{ field: ReviewOrderField.updated_at, direction: OrderDirection.DESC }]

type ReviewEnumKeys = 'environmentOptions' | 'scopeOptions' | 'tagOptions'

export type EnumOptions = EnumOptionsGeneric<ReviewEnumKeys>

export type ReviewTablePageConfig = GenericTablePageConfig<TData, TFormData, TUpdateInput, TUpdateData, TCreateInput, TCreateData, TWhereInput, TOrderField>

export type ReviewSheetConfig = GenericDetailsSheetConfig<TFormData, TData, TUpdateInput, TUpdateData, TCreateInput, TCreateData>

export type ReviewFieldProps = RenderFieldsProps<TData, TUpdateInput>
