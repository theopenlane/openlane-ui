'use client'

import React from 'react'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { type ContactQuery, type UpdateContactInput } from '@repo/codegen/src/schema'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type EnumOptions } from '../../../table/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@repo/ui/cardpanel'
import AddressField from './address-field'
import VendorSelectField from './vendor-select-field'
import LinkedVendors from './linked-vendors'
import Properties from './properties'

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

const SectionCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-1 pt-4 px-5">
      <CardTitle className="text-base p-0 m-0 leading-none">{title}</CardTitle>
      <CardDescription className="p-0 m-0 mt-1 text-sm">{description}</CardDescription>
    </CardHeader>
    <CardContent className="px-5 pb-5 pt-3">{children}</CardContent>
  </Card>
)

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
    <div className="space-y-5">
      <div className="flex flex-col mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between">
          <div className="flex flex-col gap-3">
            {isCreate && <p className="text-sm text-muted-foreground">Add the basics, then link this contact to a vendor if needed.</p>}
            <p className="text-sm text-muted-foreground">
              Required fields marked <span className="text-destructive">*</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[140px]">
               <SelectField
                name="status"
                label="Status"
                options={enumOptions.statusOptions}
                useCustomDisplay={true}
                placeholder="Select status"
                triggerClassName="h-8 text-sm"
                labelClassName="text-sm font medium mb-0"
                {...sharedFieldProps}
              />
            </div>
          </div>
        </div>
      </div>

      <SectionCard title="Basics" description="Core contact information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            name="fullName"
            label="Full name"
            placeholder="Enter full name"
            required
            tooltipContent="Provide the full name of the contact"
            initialValue={isCreate ? '' : (data?.fullName ?? '')}
            {...sharedFieldProps}
          />
          <TextField name="email" label="Email" type="email" placeholder="name@company.com" required tooltipContent="The email address for this contact" {...sharedFieldProps} />
          <TextField
            name="phoneNumber"
            type="tel"
            placeholder="e.g. +1 (303) 456-7890"
            label="Phone number"
              <>
                Phone number <span className="text-muted-foreground font-normal">(optional)</span>
              </>
            }
            tooltipContent="The phone number for this contact"
            {...sharedFieldProps}
          />
          <Properties isEditing={isEditing} isEditAllowed={isEditAllowed} data={data} internalEditing={internalEditing} setInternalEditing={setInternalEditing} handleUpdateField={handleUpdateField} />
        </div>
      </SectionCard>

      <SectionCard title="Vendor" description="Associate this contact with an existing vendor">
        <div className="space-y-4">
          <div>
            <span className="font-medium text-sm block mb-1">Linked vendor</span>
            {isCreate ? <VendorSelectField /> : <LinkedVendors data={data} isEditAllowed={isEditAllowed} />}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              name="title"
              placeholder="e.g. Account Manager, CTO"
              label="Title / role"
              }
              tooltipContent="The job title or role of this contact"
              {...sharedFieldProps}
            />
            <TextField
              name="company"
              placeholder="e.g. Finance, Operations"
              label="Department"
              tooltipContent="The department or company this contact is associated with"
              {...sharedFieldProps}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Additional details" description="More context for this contact">
        <AddressField {...sharedFieldProps} />
      </SectionCard>
    </div>
  )
}
