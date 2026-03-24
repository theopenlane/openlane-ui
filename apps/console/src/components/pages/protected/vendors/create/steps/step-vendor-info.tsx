'use client'

import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Building2, PencilIcon } from 'lucide-react'
import { EntityEntityStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { CreatableCustomTypeEnumSelect } from '@/components/shared/custom-type-enum-select/creatable-custom-type-enum-select'
import { VendorLogoDialog, type LogoSelection } from '../../vendor-logo-dialog'
import type { EditVendorFormData } from '../../hooks/use-form-schema'

interface StepVendorInfoProps {
  onLogoFileChange: (file: File | null) => void
  onLogoFileIdChange: (fileId: string | null) => void
}

const StepVendorInfo: React.FC<StepVendorInfoProps> = ({ onLogoFileChange, onLogoFileIdChange }) => {
  const form = useFormContext<EditVendorFormData>()
  const [logoDialogOpen, setLogoDialogOpen] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const vendorName = form.watch('name') ?? ''
  const vendorDisplayName = form.watch('displayName')

  const handleLogoSelect = async (selection: LogoSelection) => {
    if (selection.type === 'file') {
      onLogoFileChange(selection.file)
      onLogoFileIdChange(null)
      const url = URL.createObjectURL(selection.file)
      setLogoPreview(url)
    } else {
      onLogoFileIdChange(selection.fileId)
      onLogoFileChange(null)
      setLogoPreview(selection.previewUrl)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 pb-2">
        <button
          type="button"
          className="group/logo relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden border-0 p-0 cursor-pointer"
          onClick={() => setLogoDialogOpen(true)}
        >
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoPreview} alt="Vendor logo" className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 size={24} className="text-muted-foreground" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/logo:opacity-100 rounded-lg">
            <PencilIcon size={16} className="text-white" />
          </div>
        </button>
        <p className="text-sm text-muted-foreground">Click to add a logo</p>
      </div>

      <VendorLogoDialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen} vendorName={vendorName} vendorDisplayName={vendorDisplayName} onLogoSelect={handleLogoSelect} />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Vendor Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Corp" {...field} />
              </FormControl>
              {form.formState.errors.name?.message && <p className="text-sm text-red-500">{String(form.formState.errors.name.message)}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Official Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Acme Corporation Inc." {...field} />
              </FormControl>
              {form.formState.errors.displayName?.message && <p className="text-sm text-red-500">{String(form.formState.errors.displayName.message)}</p>}
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Brief description of the vendor and services" {...field} value={typeof field.value === 'string' ? field.value : ''} />
            </FormControl>
            {form.formState.errors.description?.message && <p className="text-sm text-red-500">{String(form.formState.errors.description.message)}</p>}
          </FormItem>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {enumToOptions(EntityEntityStatus).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.status?.message && <p className="text-sm text-red-500">{String(form.formState.errors.status.message)}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="environmentName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Environment</FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect value={field.value} options={environmentOptions} onValueChange={field.onChange} onCreateOption={createEnvironment} placeholder="Select environment" />
              </FormControl>
              {form.formState.errors.environmentName?.message && <p className="text-sm text-red-500">{String(form.formState.errors.environmentName.message)}</p>}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scope</FormLabel>
              <FormControl>
                <CreatableCustomTypeEnumSelect value={field.value ?? ''} options={scopeOptions} onValueChange={field.onChange} onCreateOption={createScope} placeholder="Select scope" />
              </FormControl>
              {form.formState.errors.scopeName?.message && <p className="text-sm text-red-500">{String(form.formState.errors.scopeName.message)}</p>}
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

export default StepVendorInfo
