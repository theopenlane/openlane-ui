'use client'

import React from 'react'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink } from '@repo/ui/breadcrumb'
import { ChevronRight } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'
import { BreadcrumbSkeleton } from './breadcrumb-skeleton'

export function BreadcrumbNavigation() {
  const crumbsData = React.useContext(BreadcrumbContext)

  if (!crumbsData.crumbs) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbsData.crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
            )}
            <BreadcrumbItem>
              {c.isLoading && (
                <div className="flex items-center gap-2">
                  <BreadcrumbSkeleton />
                </div>
              )}
              {!c.isLoading && c.href ? <BreadcrumbLink href={c.href}>{c.label ?? ''}</BreadcrumbLink> : null}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
