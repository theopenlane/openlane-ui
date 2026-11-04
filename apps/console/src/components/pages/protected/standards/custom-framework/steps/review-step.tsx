'use client'

import React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Pencil } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { StandardsIconMapper } from '@/components/shared/standards-icon-mapper/standards-icon-mapper'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { pluralizeWithCount } from '@/utils/strings'
import { CustomFrameworkBadge } from '../custom-framework-badge'
import { ControlSource, type TCreateFrameworkFormData } from '../hooks/use-custom-framework-form-schema'

type TReviewStepProps = {
  logoSrc: string | null
  onEditDetails: () => void
  onEditControls: () => void
}

const controlsSummary = (source: ControlSource, linkedCount: number): { title: string; description: string } => {
  switch (source) {
    case ControlSource.CSV:
      return { title: 'Import from CSV', description: 'After the framework is created you go straight to the import page to upload your file and map its columns.' }
    case ControlSource.LINK:
      return { title: `${pluralizeWithCount(linkedCount, 'existing control')} to link`, description: 'They join this framework and keep their evidence, owner and status.' }
    case ControlSource.SKIP:
      return { title: 'No controls yet', description: 'Add controls any time from the framework page.' }
  }
}

export const ReviewStep: React.FC<TReviewStepProps> = ({ logoSrc, onEditDetails, onEditControls }) => {
  const { control } = useFormContext<TCreateFrameworkFormData>()
  const values = useWatch({ control })
  const summary = controlsSummary(values.controlSource ?? ControlSource.SKIP, values.linkedControls?.length ?? 0)

  const details: { label: string; value?: string }[] = [
    { label: 'Short name', value: values.shortName },
    { label: 'Framework key', value: values.framework },
    { label: 'Category', value: values.standardType },
    { label: 'Governing body', value: values.governingBody },
    { label: 'Version', value: values.version },
    { label: 'Link', value: values.link },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">Check everything looks right. You can edit any of it after the framework is created.</p>
      </div>

      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <StandardsIconMapper shortName={values.shortName ?? ''} logoSrc={logoSrc} isCustom width={56} height={56} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold break-words">{values.name}</h3>
                <CustomFrameworkBadge />
              </div>
              {values.description && <p className="text-sm text-muted-foreground line-clamp-2">{values.description}</p>}
            </div>
          </div>
          <Button type="button" variant="secondary" icon={<Pencil size={16} />} iconPosition="left" onClick={onEditDetails}>
            Edit
          </Button>
        </div>

        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {details.map(({ label, value }) => (
            <div key={label} className="flex min-w-0 flex-col">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-words">{value || '-'}</dd>
            </div>
          ))}
          <div className="flex min-w-0 flex-col sm:col-span-2">
            <dt className="text-muted-foreground">Tags</dt>
            <dd className="flex flex-wrap gap-2 pt-1">{values.tags?.length ? values.tags.map((tag) => <TagChip key={tag} tag={tag} />) : '-'}</dd>
          </div>
        </dl>
      </Card>

      <Card className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="font-semibold">{summary.title}</p>
          <p className="text-sm text-muted-foreground">{summary.description}</p>
          {values.controlSource === ControlSource.LINK && !!values.linkedControls?.length && (
            <p className="mt-2 text-sm break-words">{values.linkedControls.map((linked) => linked.refCode).join(', ')}</p>
          )}
        </div>
        <Button type="button" variant="secondary" onClick={onEditControls}>
          Change
        </Button>
      </Card>
    </div>
  )
}
