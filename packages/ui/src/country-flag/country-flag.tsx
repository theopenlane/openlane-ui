'use client'

import { JSX } from 'react'
import { CircleFlag } from 'react-circle-flags'
import { countries } from 'country-data-list'

const flagCache = new Map<string, JSX.Element>()

const getFlagComponent = (alpha2: string, size: number) => {
  const key = `${alpha2.toLowerCase()}-${size}`

  if (!flagCache.has(key)) {
    flagCache.set(key, <CircleFlag countryCode={alpha2.toLowerCase()} height={size} width={size} />)
  }

  return flagCache.get(key)!
}

interface CountryFlagProps {
  value?: string
  size?: number
  showLabel?: boolean
}

export function CountryFlag({ value, size = 18, showLabel = false }: CountryFlagProps) {
  if (!value) return null

  const country = countries.all.find((c) => c.alpha3 === value)
  if (!country) return null

  const alpha2 = country.alpha2?.toLowerCase()
  if (!alpha2) return null

  const flag = size === 18 ? getFlagComponent(alpha2, size) : <CircleFlag countryCode={alpha2} height={size} width={size} />

  if (!showLabel) return flag

  return (
    <div className="flex items-center gap-2">
      {flag}
      <p className="text-sm text-muted-foreground">{country.name}</p>
    </div>
  )
}
