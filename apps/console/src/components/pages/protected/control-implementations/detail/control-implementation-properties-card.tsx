'use client'

import React from 'react'
import { BadgeCheck, CalendarClock, Tag, UserRound, UserRoundPen } from 'lucide-react'
import { Controller, useFormContext } from 'react-hook-form'
import { Card } from '@repo/ui/cardpanel'
import MultipleSelector from '@repo/ui/multiple-selector'
import { TagsCell } from '@/components/shared/crud-base/columns/tags-cell'
import { AuthorCell } from '@/components/shared/user-display/author-cell'
import { PropertyRow } from '@/components/shared/property-row/property-row'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { type ControlImplementationDetailNode } from '@/lib/graphql-hooks/control-implementation'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { formatDate, formatDateTime, formatTimeSince } from '@/utils/date'
import { type TFormData } from '../../controls/tabs/implementation/control-implementation-components/form/use-form-schema'

const iconClass = 'h-4 w-4'

type TControlImplementationPropertiesCardProps = {
  implementation: ControlImplementationDetailNode
  isEditing: boolean
}

const ControlImplementationPropertiesCard: React.FC<TControlImplementationPropertiesCardProps> = ({ implementation, isEditing }) => {
  const { control } = useFormContext<TFormData>()
  const { tagOptions } = useGetTags()
  const { userMap, tokenMap, isLoading } = useAuthorMaps([implementation.createdBy, implementation.updatedBy])

  const renderAuthor = (id?: string | null) => (isLoading ? <Skeleton height={20} className="w-24 rounded-md" /> : <AuthorCell id={id} userMap={userMap} tokenMap={tokenMap} emptyLabel="-" />)

  return (
    <Card className="rounded-xl bg-card p-4 shadow-xs">
      <h3 className="mb-4 text-lg font-medium">Properties</h3>
      <div className="flex flex-col gap-3 [&>:last-child]:border-b-0 [&>:last-child]:pb-0">
        <PropertyRow icon={<BadgeCheck className={iconClass} />} label="Verified On">
          {formatDate(implementation.verificationDate)}
        </PropertyRow>
        <PropertyRow icon={<UserRound className={iconClass} />} label="Created By">
          {renderAuthor(implementation.createdBy)}
        </PropertyRow>
        <PropertyRow icon={<CalendarClock className={iconClass} />} label="Created At">
          {formatDateTime(implementation.createdAt)}
        </PropertyRow>
        <PropertyRow icon={<UserRoundPen className={iconClass} />} label="Updated By">
          {renderAuthor(implementation.updatedBy)}
        </PropertyRow>
        <PropertyRow icon={<CalendarClock className={iconClass} />} label="Updated At">
          {formatTimeSince(implementation.updatedAt)}
        </PropertyRow>
        <PropertyRow icon={<Tag className={iconClass} />} label="Tags">
          {isEditing ? (
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <MultipleSelector
                  options={tagOptions}
                  hideClearAllButton
                  className="w-full"
                  placeholder="Add tag..."
                  creatable
                  value={(field.value ?? []).map((tag) => ({ value: tag, label: tag }))}
                  onChange={(options) => field.onChange(options.map(({ value }) => value))}
                />
              )}
            />
          ) : (
            <TagsCell tags={implementation.tags} />
          )}
        </PropertyRow>
      </div>
    </Card>
  )
}

export default ControlImplementationPropertiesCard
