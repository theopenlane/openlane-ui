'use client'

import React from 'react'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink } from '@repo/ui/breadcrumb'
import { ChevronRight, Loader } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext.tsx'

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
                  <Loader size={16} className="animate-spin" />
                </div>
              )}
              {!c.isLoading && c.href ? <BreadcrumbLink href={c.href}>{c.label}</BreadcrumbLink> : <span className="font-medium text-foreground">{c.label}</span>}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
