'use client'

import { JSX } from 'react'
import { CircleFlag } from 'react-circle-flags'
import { countries } from 'country-data-list'

const flagCache = new Map<string, JSX.Element>()

const getFlagComponent = (alpha2: string) => {
  const key = alpha2.toLowerCase()

  if (!flagCache.has(key)) {
    flagCache.set(key, <CircleFlag countryCode={key} height={18} width={18} />)
  }

  return flagCache.get(key)!
}

interface CountryFlagProps {
  value?: string
  size?: number
}

export function CountryFlag({ value, size = 18 }: CountryFlagProps) {
  if (!value) return null

  const country = countries.all.find((c) => c.alpha3 === value)
  if (!country) return null

  const alpha2 = country.alpha2?.toLowerCase()
  if (!alpha2) return null

  if (size !== 18) {
    return <CircleFlag countryCode={alpha2} height={size} width={size} />
  }

  return getFlagComponent(alpha2)
}
