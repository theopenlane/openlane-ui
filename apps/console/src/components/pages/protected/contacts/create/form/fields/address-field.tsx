'use client'

import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { type Libraries, useLoadScript } from '@react-google-maps/api'
import { useFormContext, type FieldValues } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import useClickOutside from '@/hooks/useClickOutside'

const libraries: Libraries = ['places']

interface AddressFieldProps<TUpdateInput> {
  isEditing: boolean
  isEditAllowed: boolean
  isCreate?: boolean
  data?: FieldValues | undefined
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdate?: (input: TUpdateInput) => Promise<void>
  tooltipContent?: string
}

export const AddressField = <TUpdateInput,>({
  isEditing,
  isEditAllowed,
  isCreate = false,
  data,
  internalEditing,
  setInternalEditing,
  handleUpdate,
  tooltipContent = 'The mailing address for this contact',
}: AddressFieldProps<TUpdateInput>) => {
  const { control, getValues } = useFormContext()

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [placeService, setPlaceService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [showPredictions, setShowPredictions] = useState(false)
  const wrapperRef = useClickOutside(() => setShowPredictions(false))

  useEffect(() => {
    if (isLoaded) {
      setPlaceService(new google.maps.places.AutocompleteService())
    }
  }, [isLoaded])

  const handleInputChange = (value: string, fieldOnChange: (v: string) => void) => {
    fieldOnChange(value)

    if (!placeService || !value.trim()) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    setShowPredictions(true)
    placeService.getPlacePredictions({ input: value, types: ['geocode'] }, (results) => {
      setPredictions(results || [])
    })
  }

  const handleSelectPrediction = (placeId: string, description: string, fieldOnChange: (v: string) => void) => {
    fieldOnChange(description)
    setPredictions([])
    setShowPredictions(false)

    const placesService = new google.maps.places.PlacesService(document.createElement('div'))
    placesService.getDetails({ placeId }, (place) => {
      if (!place || !place.address_components) return

      const line1 = description.split(',')[0]
      let city = ''
      let state = ''
      let postalCode = ''
      let country = ''

      place.address_components.forEach((component) => {
        if (component.types.includes('locality')) city = component.long_name
        if (component.types.includes('administrative_area_level_1')) state = component.short_name
        if (component.types.includes('postal_code')) postalCode = component.long_name
        if (component.types.includes('country')) country = component.long_name
      })

      const parts = [line1, city, state, postalCode, country].filter(Boolean)
      const fullAddress = parts.join(', ')
      fieldOnChange(fullAddress)
    })
  }

  const isFieldEditing = isCreate || isEditing || internalEditing === 'address'

  const handleBlur = async () => {
    if (isEditing) return

    const newValue = getValues('address')
    const oldValue = data?.['address'] ?? ''

    if (newValue === oldValue) {
      setInternalEditing(null)
      return
    }

    if (handleUpdate) {
      await Promise.resolve(handleUpdate({ address: newValue } as unknown as TUpdateInput))
    }

    setInternalEditing(null)
  }

  const handleClick = () => {
    if (!isEditing && isEditAllowed) {
      setInternalEditing('address')
    }
  }

  return (
    <FormField
      control={control}
      name="address"
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex items-center gap-2 shrink-0">
            <FormLabel>
              Address <span className="text-muted-foreground font-normal">(optional)</span>
            </FormLabel>
            {tooltipContent && <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={tooltipContent} />}
          </div>
          <FormControl>
            {isFieldEditing ? (
              <div ref={wrapperRef} className="relative w-full">
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Search address..."
                  onChange={(e) => handleInputChange(e.target.value, field.onChange)}
                  onBlur={handleBlur}
                  autoFocus={internalEditing === 'address'}
                  autoComplete="off"
                />
                {showPredictions && predictions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
                    {predictions.map((prediction) => (
                      <div
                        key={prediction.place_id}
                        className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectPrediction(prediction.place_id, prediction.description, field.onChange)
                        }}
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{prediction.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={cn('text-sm py-2 rounded-md px-1 w-full', isEditAllowed ? 'cursor-pointer hover:bg-accent' : 'cursor-not-allowed')} onClick={handleClick}>
                {field.value ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {field.value}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">Not set</span>
                )}
              </div>
            )}
          </FormControl>
          {fieldState.error && <p className="text-red-500 text-sm">{fieldState.error.message}</p>}
        </FormItem>
      )}
    />
  )
}

export default AddressField
