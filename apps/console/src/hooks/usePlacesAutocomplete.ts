'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { type Libraries, useLoadScript } from '@react-google-maps/api'

const libraries: Libraries = ['places']

const PREDICTION_DEBOUNCE_MS = 250 // 250ms

export type PlaceAddress = {
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type PlaceResolution = { status: 'resolved'; address: PlaceAddress } | { status: 'failed' } | { status: 'superseded' }

export const formatPlaceAddress = ({ line1, line2, city, state, postalCode, country }: PlaceAddress): string => [line1, line2, city, state, postalCode, country].filter(Boolean).join(', ')

export const usePlacesAutocomplete = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isError, setIsError] = useState(false)

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const requestIdRef = useRef(0)
  const resolutionIdRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelPendingRequest = useCallback(() => {
    requestIdRef.current += 1

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }, [])

  const fetchSuggestions = useCallback(async (input: string) => {
    const requestId = ++requestIdRef.current

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
    }

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
        setIsError(true)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSearching(false)
      }
    }
  }, [])

  const clearPredictions = useCallback(() => {
    cancelPendingRequest()
    setPredictions([])
    setIsSearching(false)
    setIsError(false)
  }, [cancelPendingRequest])

  const search = useCallback(
    (input: string) => {
      cancelPendingRequest()
      resolutionIdRef.current += 1
      setIsError(false)

      if (!isLoaded || !input.trim()) {
        setPredictions([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      setPredictions([])
      debounceRef.current = setTimeout(() => fetchSuggestions(input), PREDICTION_DEBOUNCE_MS)
    },
    [cancelPendingRequest, fetchSuggestions, isLoaded],
  )

  const resolveAddress = useCallback(async (prediction: google.maps.places.PlacePrediction): Promise<PlaceResolution> => {
    const resolutionId = ++resolutionIdRef.current

    try {
      const place = prediction.toPlace()
      await place.fetchFields({ fields: ['addressComponents'] })

      if (resolutionId !== resolutionIdRef.current) return { status: 'superseded' }

      const components = place.addressComponents ?? []
      const component = (type: string, short = false) => {
        const match = components.find((item) => item.types.includes(type))
        return (short ? match?.shortText : match?.longText) ?? ''
      }

      const street = [component('street_number'), component('route')].filter(Boolean).join(' ')

      return {
        status: 'resolved',
        address: {
          line1: street || prediction.mainText?.text || prediction.text.text,
          line2: '',
          city: component('locality') || component('postal_town') || component('sublocality_level_1'),
          state: component('administrative_area_level_1', true),
          postalCode: component('postal_code'),
          country: component('country'),
        },
      }
    } catch {
      return resolutionId === resolutionIdRef.current ? { status: 'failed' } : { status: 'superseded' }
    } finally {
      sessionTokenRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return { predictions, isSearching, isError, search, clearPredictions, resolveAddress }
}
