'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { activatable } from '@repo/ui/lib/a11y'
import useClickOutside from '@/hooks/useClickOutside'
import { type PlaceAddress, usePlacesAutocomplete } from '@/hooks/usePlacesAutocomplete'

interface AddressAutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onAddressResolved: (address: PlaceAddress) => void
  onResolveError?: () => void
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void
  id?: string
  placeholder?: string
  autoFocus?: boolean
}

export const AddressAutocompleteInput = ({ value, onChange, onAddressResolved, onResolveError, onBlur, id, placeholder = 'Start typing an address...', autoFocus }: AddressAutocompleteInputProps) => {
  const [showPredictions, setShowPredictions] = useState(false)
  const { predictions, isSearching, isError, search, clearPredictions, resolveAddress } = usePlacesAutocomplete()
  const wrapperRef = useClickOutside(() => setShowPredictions(false))
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectionCount, setSelectionCount] = useState(0)

  useEffect(() => {
    if (selectionCount > 0) {
      inputRef.current?.focus()
    }
  }, [selectionCount])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
    setShowPredictions(true)
    search(event.target.value)
  }

  const handleSelectPrediction = async (prediction: google.maps.places.PlacePrediction) => {
    onChange(prediction.text.text)
    clearPredictions()
    setShowPredictions(false)
    setSelectionCount((previous) => previous + 1)

    const resolution = await resolveAddress(prediction)

    if (resolution.status === 'superseded') return

    if (resolution.status === 'failed') {
      onResolveError?.()
      return
    }

    onAddressResolved(resolution.address)
  }

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
    onBlur?.(event)
  }

  const hasTypedSomething = value.trim().length > 0

  return (
    <div ref={wrapperRef} className="relative w-full" onBlur={handleBlur}>
      <Input ref={inputRef} id={id} value={value} placeholder={placeholder} onChange={handleChange} autoFocus={autoFocus} autoComplete="off" />
      {showPredictions && hasTypedSomething && (
        <div role="presentation" className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md" onMouseDown={(event) => event.preventDefault()}>
          {isSearching && <p className="px-3 py-2 text-sm text-muted-foreground">Searching addresses...</p>}
          {!isSearching && isError && <p className="px-3 py-2 text-sm text-muted-foreground">Could not load address suggestions. Please try again later.</p>}
          {!isSearching && !isError && predictions.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">No addresses found.</p>}
          {!isSearching &&
            predictions.map((prediction) => (
              <div
                key={prediction.placeId}
                {...activatable(() => handleSelectPrediction(prediction))}
                className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{prediction.text.text}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
