'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { type Libraries, useLoadScript } from '@react-google-maps/api'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useOrganization } from '@/hooks/useOrganization'
import useClickOutside from '@/hooks/useClickOutside'
import { useGetOrganizationSetting, useUpdateOrganization } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'

const libraries: Libraries = ['places']

const PREDICTION_DEBOUNCE_MS = 250

const BillingContactDialog = () => {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const { data: setting } = useGetOrganizationSetting(currentOrgId)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { successNotification, errorNotification } = useNotification()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([])
  const [showPredictions, setShowPredictions] = useState<boolean>(false)
  const wrapperRef = useClickOutside(() => setShowPredictions(false))
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  })

  const inputRef = useRef<HTMLInputElement | null>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const requestIdRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!isLoaded || !input.trim()) {
        setPredictions([])
        return
      }

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
      }

      const requestId = ++requestIdRef.current

      try {
        const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedPrimaryTypes: ['geocode'],
          sessionToken: sessionTokenRef.current,
        })

        if (requestId !== requestIdRef.current) return

        setPredictions(suggestions.map((suggestion) => suggestion.placePrediction).filter((prediction): prediction is google.maps.places.PlacePrediction => !!prediction))
      } catch {
        if (requestId === requestIdRef.current) {
          setPredictions([])
        }
      }
    },
    [isLoaded],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setShowPredictions(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), PREDICTION_DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleSelectPrediction = async (prediction: google.maps.places.PlacePrediction) => {
    setPredictions([])
    setShowPredictions(false)

    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents'] })

      const components = place.addressComponents ?? []
      const component = (type: string, short = false) => {
        const match = components.find((item) => item.types.includes(type))
        return (short ? match?.shortText : match?.longText) ?? ''
      }

      const street = [component('street_number'), component('route')].filter(Boolean).join(' ')

      setAddress({
        line1: street || prediction.mainText?.text || prediction.text.text,
        line2: '',
        city: component('locality') || component('postal_town') || component('sublocality_level_1'),
        state: component('administrative_area_level_1', true),
        postalCode: component('postal_code'),
        country: component('country'),
      })
    } catch {
      errorNotification({
        title: 'Error',
        description: 'Could not load the details for the selected address, please fill it in manually.',
      })
    } finally {
      sessionTokenRef.current = null
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setAddress((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateOrg({
        updateOrganizationId: currentOrgId ?? '',
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
      setOpen(false)
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
    <Dialog open={open} onOpenChange={setOpen} aria-describedby={undefined}>
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
                    <p key={prediction.placeId} onClick={() => handleSelectPrediction(prediction)} className="p-2 cursor-pointer">
                      {prediction.text.text}
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
            <SaveButton className="w-full" isSaving={isPending} disabled={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BillingContactDialog
