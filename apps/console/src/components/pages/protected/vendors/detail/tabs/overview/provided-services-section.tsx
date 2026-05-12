'use client'

import React, { useMemo, useRef, useState } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Badge } from '@repo/ui/badge'
import MultipleSelector from '@repo/ui/multiple-selector'
import { type EntityQuery, type UpdateEntityInput } from '@repo/codegen/src/schema'
import useClickOutsideWithPortal from '@/hooks/useClickOutsideWithPortal'
import useEscapeKey from '@/hooks/useEscapeKey'
import { type EditVendorFormData } from '../../../hooks/use-form-schema'

interface ProvidedServicesSectionProps {
  vendor: EntityQuery['entity']
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
}

const ProvidedServicesSection: React.FC<ProvidedServicesSectionProps> = ({ vendor, isEditing, canEdit, handleUpdateField }) => {
  const { control, watch, setValue } = useFormContext<EditVendorFormData>()
  const [internalEditing, setInternalEditing] = useState(false)

  const providedServices = watch('providedServices')
  const providedServicesValues = useMemo(() => {
    return (providedServices ?? []).filter((item: string): item is string => typeof item === 'string').map((item: string) => ({ value: item, label: item }))
  }, [providedServices])

  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const blurProvidedServices = () => {
    const current = vendor?.providedServices || []
    const next = providedServicesValues.map((item) => item.value)
    const changed = current.length !== next.length || current.some((val) => !next.includes(val))

    if (changed) {
      setValue('providedServices', next)
      handleUpdateField({ providedServices: next })
    }
  }

  useClickOutsideWithPortal(
    () => {
      if (internalEditing) {
        blurProvidedServices()
      }
      setInternalEditing(false)
    },
    {
      refs: { triggerRef, popoverRef },
      enabled: internalEditing,
    },
  )

  useEscapeKey(
    () => {
      setValue('providedServices', vendor?.providedServices ?? [])
      setInternalEditing(false)
    },
    { enabled: internalEditing },
  )

  const isEditMode = isEditing || internalEditing

  return (
    <div className="w-full pb-4">
      <div className="flex items-center mb-1">
        <span className="font-medium">Provided Services</span>
      </div>

      <div ref={triggerRef} className="w-full">
        {isEditMode ? (
          <Controller
            name="providedServices"
            control={control}
            render={({ field }) => (
              <MultipleSelector
                options={[]}
                hideClearAllButton
                className="w-full"
                placeholder="Add service..."
                creatable
                value={providedServicesValues}
                onChange={(selectedOptions) => {
                  const newServices = selectedOptions.map((opt) => opt.value)
                  field.onChange(newServices)
                }}
              />
            )}
          />
        ) : (
          <div className={`text-sm py-2 rounded-md w-full hover:bg-accent ${canEdit ? 'cursor-pointer' : ''}`} onClick={() => canEdit && !isEditing && setInternalEditing(true)}>
            {vendor?.providedServices?.length ? (
              <div className="flex gap-2 flex-wrap">
                {vendor.providedServices.map((service) => (
                  <Badge key={service} variant="outline" className="flex items-center gap-1 w-fit">
                    <span>{service}</span>
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm italic">No services</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProvidedServicesSection
