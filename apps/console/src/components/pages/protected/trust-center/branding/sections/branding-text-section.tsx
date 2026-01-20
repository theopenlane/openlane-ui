'use client'

import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { useFormContext } from 'react-hook-form'
import { BrandFormValues } from '../brand-schema'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'

interface BrandingTextSectionProps {
  isReadOnly: boolean
  setting: TrustCenterSetting
  hasWarning?: boolean
}

export const BrandingTextSection = ({ isReadOnly, hasWarning, setting }: BrandingTextSectionProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<BrandFormValues>()

  const renderField = (name: keyof BrandFormValues, label: string, component: 'input' | 'textarea') => {
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

  return (
    <Card>
      <CardContent>
        {hasWarning && <SectionWarning />}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Title and Overview</p>
            <p className="text-sm text-inverted-muted-foreground">This information appears prominently at the top of your Trust Center and is used for SEO.</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-base font-medium">Title</p>
            {renderField('title', 'Title', 'input')}
            {!isReadOnly && errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-medium">Overview</p>
            {renderField('overview', 'Overview', 'textarea')}
            {!isReadOnly && errors.overview && <p className="text-xs text-red-500">{errors.overview.message}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium">Security Email Address</p>
              <p className="text-sm text-inverted-muted-foreground">Public contact email for responsible disclosure of security vulnerabilities</p>
            </div>
            {renderField('securityContact', 'Security Email', 'input')}
            {!isReadOnly && errors.securityContact && <p className="text-xs text-red-500">{errors.securityContact.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
