'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import { type UseFormReturn } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import { Panel } from '@repo/ui/panel'
import { Input } from '@repo/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type EntityQuery } from '@repo/codegen/src/schema'
import { TIER_OPTIONS, TierBadge } from '@/components/pages/protected/reviews/common/risk-review-config'
import { ReadOnlyField } from '@/components/shared/read-only-field/read-only-field'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { getVendorLogoUrl } from '@/lib/vendor-logo'
import { type VendorReviewFormData } from './use-vendor-review-form-schema'

type TVendorReviewContextPanelProps = {
  vendor: EntityQuery['entity']
  form: UseFormReturn<VendorReviewFormData>
  isEditing: boolean
}

const VendorReviewContextPanel: React.FC<TVendorReviewContextPanelProps> = ({ vendor, form, isEditing }) => {
  const { convertToReadOnly } = usePlateEditor()
  const logoUrl = getVendorLogoUrl(vendor.logoFile)
  const description = useMemo(() => (vendor.description ? convertToReadOnly(vendor.description) : null), [vendor.description, convertToReadOnly])

  return (
    <Panel className="p-4 flex flex-col gap-4">
      <p className="text-lg font-medium">Context</p>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {logoUrl ? (
            <Image src={logoUrl} alt={`${vendor.name ?? 'Vendor'} logo`} width={40} height={40} unoptimized className="h-full w-full object-contain p-1" />
          ) : (
            <Building2 size={20} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium break-words">{vendor.name ?? '—'}</span>
          {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isEditing ? (
          <>
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Tier</FormLabel>
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <TierBadge tier={option.value} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Rating</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="e.g. Moderate" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="riskScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Score</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} type="number" min={0} step={1} placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <>
            <ReadOnlyField label="Risk Tier">{vendor.tier ? <TierBadge tier={vendor.tier} /> : null}</ReadOnlyField>
            <ReadOnlyField label="Risk Rating">{vendor.riskRating}</ReadOnlyField>
            <ReadOnlyField label="Risk Score">{vendor.riskScore}</ReadOnlyField>
          </>
        )}
      </div>
    </Panel>
  )
}

export default VendorReviewContextPanel
