'use client'

import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useSession } from 'next-auth/react'
import React, { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'

export const step1Schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  domains: z.string().min(1, 'Domain cannot be empty').nonempty('Please enter at least one domain'),
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
]

export default function Step1() {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<Step1Values>()

  const { data: sessionData } = useSession()

  const domain = sessionData?.user.email.split('@')[1]
  const selectedSector = watch('companyDetails.sector')

  useEffect(() => {
    if (domain) {
      setValue('domains', domain)
    }
  }, [domain, setValue])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Company Info</h2>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name*</Label>
        <Input id="companyName" required {...register('companyName')} />
        {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName.message}</p>}
      </div>

      {/* Company Domains */}
      <div className="space-y-2">
        <Label htmlFor="domains">Company Domain(s)*</Label>
        <Input id="domains" required {...register('domains')} />
        {errors.domains && <p className="text-red-500 text-sm">{errors.domains.message}</p>}
      </div>

      {/* Company Size */}
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
            <SelectItem value="Other (Please Specify)">Other (Please Specify)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom input for "Other" sector */}
      {selectedSector === 'Other (Please Specify)' && (
        <div className="space-y-2">
          <Label htmlFor="otherSector">Please Specify</Label>
          <Input id="otherSector" placeholder="Enter your sector" {...register('companyDetails.otherSector')} />
        </div>
      )}

      {/* Validation Errors */}
      {errors.companyDetails?.sector && <p className="text-red-500 text-sm">{errors.companyDetails.sector.message}</p>}
      {errors.companyDetails?.otherSector && <p className="text-red-500 text-sm">{errors.companyDetails.otherSector.message}</p>}
    </div>
  )
}
