'use client'

import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { type ContactQuery, type UpdateContactInput } from '@repo/codegen/src/schema'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'

interface AdditionalFieldsProps {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: ContactQuery['contact'] | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdateField?: (input: UpdateContactInput) => Promise<void>
  enumOptions: EnumOptions
}

export const AdditionalFields: React.FC<AdditionalFieldsProps> = ({ isEditing, isEditAllowed, isCreate = false, data, internalEditing, setInternalEditing, handleUpdateField, enumOptions }) => {
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
      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Contact Information</CardTitle>
          <CardDescription className="p-0">Email, phone, and address details for this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="email" label="Email" type="email" tooltipContent="The email address for this contact" {...sharedFieldProps} />
            <TextField name="phoneNumber" label="Phone Number" tooltipContent="The phone number for this contact" {...sharedFieldProps} />
            <TextField name="address" label="Address" tooltipContent="The mailing address for this contact" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md p-0">Professional Details</CardTitle>
          <CardDescription className="p-0">Company and title information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <TextField name="company" label="Company" tooltipContent="The company this contact is associated with" {...sharedFieldProps} />
            <TextField name="title" label="Title" tooltipContent="The job title of this contact" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-md p-0">Classification</CardTitle>
          <CardDescription className="p-0">Status of this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            <SelectField name="status" label="Status" options={enumOptions.statusOptions} tooltipContent="The current status of this contact" {...sharedFieldProps} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
