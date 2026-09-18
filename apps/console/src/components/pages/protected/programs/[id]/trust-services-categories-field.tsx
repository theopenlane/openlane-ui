'use client'

import React, { useMemo } from 'react'

import { Badge } from '@repo/ui/badge'
import { Label } from '@repo/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip'

import { programFrameworkControlsWhere } from '@/constants/standards'
import { SOC_2_REQUIRED_CATEGORY, sortTrustServicesCategories } from '@/constants/trust-services-categories'
import { useGetControlCategoriesByFramework } from '@/lib/graphql-hooks/control'
import TrustServicesCategoriesSlideout from './trust-services-categories-slideout'

type TTrustServicesCategoriesFieldProps = {
  programId: string
  frameworkName: string
  canManage: boolean
}

const TrustServicesCategoriesField = ({ programId, frameworkName, canManage }: TTrustServicesCategoriesFieldProps) => {
  const { categories, isPending } = useGetControlCategoriesByFramework({ where: programFrameworkControlsWhere(programId, frameworkName) })

  const programCategories = useMemo(() => sortTrustServicesCategories(categories), [categories])

  return (
    <div className="flex border-b pb-3 items-start">
      <Label className="block w-56 shrink-0 pt-0.5">Trust Services Categories</Label>
      <div className="flex flex-1 min-w-0 flex-wrap items-center gap-2">
        {programCategories.map((category) =>
          category === SOC_2_REQUIRED_CATEGORY ? (
            <Tooltip key={category}>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="w-fit cursor-help">
                  {category}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-normal">
                {SOC_2_REQUIRED_CATEGORY} is included by default because it is required for every {frameworkName} program.
              </TooltipContent>
            </Tooltip>
          ) : (
            <Badge key={category} variant="outline" className="w-fit">
              {category}
            </Badge>
          ),
        )}
        {!isPending && programCategories.length === 0 && <span className="text-neutral-400">—</span>}
        {canManage && <TrustServicesCategoriesSlideout programId={programId} frameworkName={frameworkName} programCategories={programCategories} disabled={isPending} />}
      </div>
    </div>
  )
}

export default TrustServicesCategoriesField
