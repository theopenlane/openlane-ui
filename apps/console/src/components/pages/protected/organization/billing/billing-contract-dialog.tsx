'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import { Button } from '@repo/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useUpdateOrganizationMutation } from '@repo/codegen/src/schema'
import { useOrganization } from '@/hooks/useOrganization'

const libraries: any = ['places']

const BillingContactDialog = () => {
  const { currentOrgId, currentOrg } = useOrganization()
  const [{ fetching: isSubmitting }, updateOrg] = useUpdateOrganizationMutation()

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [fullName, setFullName] = useState('')
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [placeService, setPlaceService] = useState<google.maps.places.AutocompleteService | null>(null)
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

      let line1 = description.split(',')[0]
      let line2 = ''
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
    })
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setAddress((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await updateOrg({
      updateOrganizationId: currentOrgId,
      input: {
        updateOrgSettings: {
          billingAddress: address,
          billingContact: fullName,
        },
      },
    })
  }

  useEffect(() => {
    if (!currentOrg) {
      return
    }
    setAddress(currentOrg?.setting?.billingAddress)
    setFullName(currentOrg?.setting?.billingContact || '')
    return () => {}
  }, [currentOrg])

  return (
    <Dialog aria-describedby={undefined}>
      <DialogDescription />
      <DialogTrigger asChild>
        <h1 className="text-brand text-lg font-medium cursor-pointer">Edit</h1>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[455px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Billing Contact</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="relative">
            <Label htmlFor="line1">Address Line 1</Label>
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
            {predictions.length > 0 && (
              <div className="absolute z-10 bg-panel border rounded shadow-md w-full">
                {predictions.map((prediction) => (
                  <p key={prediction.place_id} onClick={() => handleSelectPrediction(prediction.place_id, prediction.description)} className="p-2 cursor-pointer">
                    {prediction.description}
                  </p>
                ))}
              </div>
            )}
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
              <Button className="w-full mt-4" type="submit" variant="filled" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BillingContactDialog
