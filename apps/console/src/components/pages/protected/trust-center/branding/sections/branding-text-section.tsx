'use client'

import { Card, CardContent } from '@repo/ui/cardpanel'
import SectionWarning from '../section-warning'
import { Controller, useFormContext } from 'react-hook-form'
import { BrandFormValues } from '../brand-schema'
import { TrustCenterSetting } from '@/lib/graphql-hooks/trust-center'
import { RenderBrandField } from '../../shared/render-field'
import PlateEditor from '@/components/shared/plate/plate-editor'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from 'platejs'

interface BrandingTextSectionProps {
  isReadOnly: boolean
  setting: TrustCenterSetting
  hasWarning?: boolean
}

export const BrandingTextSection = ({ isReadOnly, hasWarning, setting }: BrandingTextSectionProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BrandFormValues>()
  const { convertToReadOnly } = usePlateEditor()

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
            {isReadOnly ? (
              <div className="rounded-md px-3 py-2">
                {setting?.overview ? convertToReadOnly(setting.overview, 0, { padding: 0 }) : <p className="text-sm text-muted-foreground italic">No information provided</p>}
              </div>
            ) : (
              <Controller
                control={control}
                name="overview"
                render={({ field }) => <PlateEditor initialValue={field.value as string | Value} onChange={(value) => field.onChange(value)} placeholder="Overview" />}
              />
            )}
            {!isReadOnly && errors.overview && <p className="text-xs text-red-500">{errors.overview.message}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
