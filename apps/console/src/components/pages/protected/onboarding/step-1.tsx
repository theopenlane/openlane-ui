'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'

export const step1Schema = z.object({
  companyName: z.string().min(3, 'Company name requires at least 3 characters'),
  domains: z.array(z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')).min(1, 'Please enter at least one domain'),
  companyDetails: z.object({
    size: z.string().optional(),
    sector: z.string().optional(),
    otherSector: z.string().optional(),
  }),
})

type Step1Values = zInfer<typeof step1Schema>

const companySizes = [
  { value: '1–10', label: '1–10 employees (Freelancers, solo entrepreneurs, or small startups)' },
  { value: '11–50', label: '11–50 employees (Small businesses or growing teams)' },
  { value: '51–200', label: '51–200 employees (Mid-sized companies or established startups)' },
  { value: '201-1000', label: '201–1,000 employees (Small to mid-sized enterprises)' },
  { value: '1000+', label: '1,000+ employees (Large enterprises or corporations)' },
]

const companySectors = [
  'Education',
  'Energy & Utilities',
  'Finance & Banking',
  'Government & Public Sector',
  'Healthcare & Biotechnology',
  'Hospitality & Travel',
  'Logistics & Transportation',
  'Manufacturing',
  'Marketing & Advertising',
  'Media & Entertainment',
  'Nonprofit & Social Impact',
  'Professional Services (Consulting, Legal, etc.)',
  'Real Estate & Construction',
  'Retail & E-Commerce',
  'Technology (Software/Hardware)',
  'Other (Please Specify)',
]

export default function Step1() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<Step1Values>()

  const { data: sessionData } = useSession()

  const [domainInput, setDomainInput] = useState('')
  const userDomain = sessionData?.user.email.split('@')[1]
  const domains = watch('domains') || []

  useEffect(() => {
    if (userDomain && !domains.includes(userDomain)) {
      setValue('domains', [...domains, userDomain])
    }
  }, [userDomain, setValue])

  const addDomain = () => {
    if (!domainInput.trim()) return

    const isValidDomain = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domainInput)
    if (!isValidDomain) {
      alert('Invalid domain format. Example: acme.com')
      return
    }

    if (!domains.includes(domainInput.trim())) {
      setValue('domains', [...domains, domainInput.trim()])
      setDomainInput('')
    }
  }

  const removeDomain = (domainToRemove: string) => {
    setValue(
      'domains',
      domains.filter((d) => d !== domainToRemove),
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!domainInput) {
      return
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      addDomain()
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Company Info</h2>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name*</Label>
        <Input id="companyName" required {...register('companyName')} />
        {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="domains">Company Domain(s)*</Label>
        <TooltipProvider disableHoverableContent={true}>
          <Tooltip>
            <TooltipTrigger type="button">
              <InfoIcon size={14} className="mx-1 mt-1" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Add the top-level domains associated with your company (e.g., acme.com). Avoid subdomains like app.acme.com</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex flex-wrap gap-2 border rounded-md p-2">
          {domains.map((domain) => (
            <Badge key={domain} className="flex items-center gap-1">
              {domain}
              <button type="button" onClick={() => removeDomain(domain)} className="ml-1">
                <X size={12} />
              </button>
            </Badge>
          ))}
          <Input id="domains" type="text" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} onKeyDown={handleKeyDown} className="border-none outline-none flex-1" />
        </div>
        <Button
          onClick={(e) => {
            e.preventDefault()
            addDomain()
          }}
          variant="outline"
          className="mt-2 "
        >
          Add Domain
        </Button>
        {errors.domains && <p className="text-red-500 text-sm">{errors.domains.message as string}</p>}
      </div>

      <div className="space-y-2">
        <Label>Company Size</Label>
        <Select onValueChange={(value) => setValue('companyDetails.size', value)} defaultValue={watch('companyDetails.size')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            {companySizes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Company Sector */}
      <div className="space-y-2">
        <Label>Company Sector</Label>
        <Select onValueChange={(value) => setValue('companyDetails.sector', value)} defaultValue={watch('companyDetails.sector')}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent>
            {companySectors.map((sector) => (
              <SelectItem key={sector} value={sector}>
                {sector}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom input for "Other" sector */}
      {watch('companyDetails.sector') === 'Other (Please Specify)' && (
        <div className="space-y-2">
          <Label htmlFor="otherSector">Please Specify</Label>
          <Input id="otherSector" placeholder="Enter your sector" {...register('companyDetails.otherSector')} />
        </div>
      )}
    </div>
  )
}
