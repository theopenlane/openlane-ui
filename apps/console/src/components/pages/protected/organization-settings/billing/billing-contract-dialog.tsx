'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Libraries, useLoadScript } from '@react-google-maps/api'
import { Button } from '@repo/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useOrganization } from '@/hooks/useOrganization'
import useClickOutside from '@/hooks/useClickOutside'
import { useGetOrganizationSetting, useUpdateOrganization } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const libraries: Libraries = ['places']

const BillingContactDialog = () => {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const { data: setting } = useGetOrganizationSetting(currentOrgId)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { successNotification, errorNotification } = useNotification()
  const wrapperRef = useClickOutside(() => setShowPredictions(false))
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [fullName, setFullName] = useState('')
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [placeService, setPlaceService] = useState<google.maps.places.AutocompleteService | null>(null)
  const [showPredictions, setShowPredictions] = useState<boolean>(false)
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isLoaded) {
      setPlaceService(new google.maps.places.AutocompleteService())
    }
  }, [isLoaded])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setShowPredictions(true)
    if (!placeService) return

    placeService.getPlacePredictions({ input: value, types: ['geocode'] }, (results) => {
      setPredictions(results || [])
    })
  }

  const handleSelectPrediction = (placeId: string, description: string) => {
    setPredictions([])

    const placesService = new google.maps.places.PlacesService(document.createElement('div'))
    placesService.getDetails({ placeId }, (place) => {
      if (!place || !place.address_components) return

      const line1 = description.split(',')[0]
      const line2 = ''
      let city = ''
      let state = ''
      let postalCode = ''
      let country = ''

      place.address_components.forEach((component) => {
        if (component.types.includes('locality')) {
          city = component.long_name
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name
        }
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name
        }
        if (component.types.includes('country')) {
          country = component.long_name
        }
      })

      setAddress({ line1, line2, city, state, postalCode, country })
      setShowPredictions(false)
    })
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setAddress((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateOrg({
        updateOrganizationId: currentOrgId!,
        input: {
          updateOrgSettings: {
            billingAddress: address,
            billingContact: fullName,
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })
      successNotification({
        title: `Successfully saved your billing address!`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    if (!setting) {
      return
    }
    setAddress(setting.organization.setting?.billingAddress)

    setFullName(setting.organization.setting?.billingContact || '')
    return () => {}
  }, [setting])

  return (
    <Dialog aria-describedby={undefined}>
      <DialogTrigger asChild>
        <h1 className="text-brand text-sm font-medium cursor-pointer">Edit</h1>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[455px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Billing Address</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="relative">
            <Label htmlFor="line1">Address Line 1</Label>
            <div ref={wrapperRef} className="relative w-full">
              <Input
                ref={inputRef}
                id="line1"
                value={address.line1}
                onChange={(e) => {
                  handleAddressChange(e)
                  handleInputChange(e)
                }}
                placeholder="Start typing an address..."
              />
              {showPredictions && predictions.length > 0 && (
                <div className="absolute z-10 bg-panel border rounded-sm shadow-md w-full">
                  {predictions.map((prediction) => (
                    <p key={prediction.place_id} onClick={() => handleSelectPrediction(prediction.place_id, prediction.description)} className="p-2 cursor-pointer">
                      {prediction.description}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="line2">Address Line 2</Label>
            <Input id="line2" value={address.line2} onChange={handleAddressChange} placeholder="Apt., suite, unit number, etc." />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={address.country} onChange={handleAddressChange} placeholder="Country" />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={address.city} onChange={handleAddressChange} placeholder="City" />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={address.state} onChange={handleAddressChange} placeholder="State" />
          </div>

          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input id="postalCode" value={address.postalCode} onChange={handleAddressChange} className="max-w-[150px]" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button className="w-full mt-4" type="submit" variant="filled" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BillingContactDialog
