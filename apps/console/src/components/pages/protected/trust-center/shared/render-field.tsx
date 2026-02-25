'use client'

import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { UseFormRegister } from 'react-hook-form'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { BrandFormValues } from '../branding/brand-schema'

interface RenderBrandFieldProps {
  name: keyof BrandFormValues
  label: string
  component: 'input' | 'textarea'
  isReadOnly: boolean
  setting: TrustCenterSetting
  register: UseFormRegister<BrandFormValues>
}

export const RenderBrandField = ({ name, label, component, isReadOnly, setting, register }: RenderBrandFieldProps) => {
  if (isReadOnly) {
    const value = setting?.[name as keyof TrustCenterSetting]
    const displayValue = typeof value === 'string' || typeof value === 'number' ? value : null

    return (
      <div className="py-2">
        <p className="text-sm text-foreground wrap-break-word">{displayValue || <span className="text-muted-foreground italic">No information provided</span>}</p>
      </div>
    )
  }

  const Component = component === 'input' ? Input : Textarea

  return <Component {...register(name)} placeholder={label} className="w-full" />
}
