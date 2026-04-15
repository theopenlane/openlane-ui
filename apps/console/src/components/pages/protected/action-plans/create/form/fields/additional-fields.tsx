'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { DateField } from '@/components/shared/crud-base/form-fields/date-field'
import { type UpdateActionPlanInput, ActionPlanDocumentStatus, ActionPlanPriority, ActionPlanFrequency } from '@repo/codegen/src/schema'
import { type FieldValues, Controller, useFormContext } from 'react-hook-form'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import PlateEditor from '@/components/shared/plate/plate-editor'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateActionPlanInput) => Promise<void>
}

const statusOptions = enumToOptions(ActionPlanDocumentStatus)
const priorityOptions = enumToOptions(ActionPlanPriority)
const frequencyOptions = enumToOptions(ActionPlanFrequency)

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, handleUpdateField }) => {
  const { control } = useFormContext()

  const sharedFieldProps = {
    isEditing,
    isEditAllowed,
    isCreate,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate: handleUpdateField,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Details</CardTitle>
          <CardDescription className="p-0">Title, status, and priority of the action plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 gap-2">
            <TextField name="title" label="Title" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="status" label="Status" options={statusOptions} {...sharedFieldProps} />
            <SelectField name="priority" label="Priority" options={priorityOptions} {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Content</CardTitle>
          <CardDescription className="p-0">Description of the action plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            {isCreate || (isEditAllowed && isEditing) ? (
              <Controller
                control={control}
                name="descriptionJSON"
                render={({ field }) => (
                  <PlateEditor initialValue={data?.description} onChange={(val) => field.onChange(val)} isCreate={isCreate} placeholder="Write a description for the action plan" />
                )}
              />
            ) : (
              <PlateEditor key={JSON.stringify(data?.description)} initialValue={data?.description} readonly variant="readonly" toolbarClassName="hidden" placeholder="No description set" />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Schedule</CardTitle>
          <CardDescription className="p-0">Due dates and review frequency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <DateField name="dueDate" label="Due Date" {...sharedFieldProps} />
            <DateField name="reviewDue" label="Review Due" {...sharedFieldProps} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="reviewFrequency" label="Review Frequency" options={frequencyOptions} {...sharedFieldProps} />
            <TextField name="source" label="Source" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
