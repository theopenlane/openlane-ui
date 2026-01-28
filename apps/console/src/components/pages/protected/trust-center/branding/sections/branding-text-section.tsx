'use client'

import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { useFormContext } from 'react-hook-form'
import { BrandFormValues } from '../brand-schema'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { RenderBrandField } from '../../shared/render-field'

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
            <RenderBrandField name="title" label="Title" component="input" isReadOnly={isReadOnly} setting={setting} register={register} />
            {!isReadOnly && errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-base font-medium">Overview</p>
            <RenderBrandField name="overview" label="Overview" component="textarea" isReadOnly={isReadOnly} setting={setting} register={register} />
            {!isReadOnly && errors.overview && <p className="text-xs text-red-500">{errors.overview.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
