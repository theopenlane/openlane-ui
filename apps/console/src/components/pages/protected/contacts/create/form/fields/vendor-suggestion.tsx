'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { getEmailDomain } from '@/utils/strings'
import { type ContactFormData } from '../../../hooks/use-form-schema'

const VendorSuggestion: React.FC = () => {
  const { watch, setValue } = useFormContext<ContactFormData>()
  const email = watch('email')
  const entityIDs = watch('entityIDs') ?? []
  const domain = getEmailDomain(email)

  const { vendorNodes: matches } = useVendorsWithFilter({ where: domain ? { domainsHas: domain } : undefined, enabled: !!domain })

  if (matches.length === 0) return null

  const toggle = (id: string) => {
    const next = entityIDs.includes(id) ? entityIDs.filter((x) => x !== id) : [...entityIDs, id]
    setValue('entityIDs', next, { shouldDirty: true })
  }

  return (
    <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">
          {matches.length === 1 ? 'Matching vendor' : 'Matching vendors'} found for “{domain}”
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {matches.map((v) => {
          const linked = entityIDs.includes(v.id)
          const label = v.displayName || v.name || 'Vendor'
          return (
            <Button key={v.id} type="button" size="md" variant={linked ? 'filled' : 'outline'} onClick={() => toggle(v.id)}>
              {linked ? (
                <span className="flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {`Linked: ${label}`}
                </span>
              ) : (
                `Link ${label}`
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default VendorSuggestion
