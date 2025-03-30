'use client'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@repo/ui/breadcrumb'
import { ChevronRight, Loader } from 'lucide-react'
import React from 'react'
import { toTitleCase } from '@/components/shared/lib/strings'
import { useParams, usePathname } from 'next/navigation'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import { useGetControlById } from '@/lib/graphql-hooks/controls'

type TBreadCrumbProps = {
  homeElement?: string
}

export const BreadcrumbNavigation = ({ homeElement = 'Home' }: TBreadCrumbProps) => {
  const pathname = usePathname()
  const params = useParams()
  const pathNames = pathname.split('/').filter(Boolean)

  const isPolicy = pathNames.includes('policies')
  const policyId = isPolicy ? (params.id as string) : null
  const isStandard = pathNames.includes('standards')
  const standardId = isStandard ? (params.id as string) : null
  const isControl = pathNames.includes('controls')
  const controlId = isControl ? (params.id as string) : null

  const { data, isLoading: isLoadingPolicy } = useGetInternalPolicyDetailsById(policyId)
  const { data: standardData, isLoading: isLoadingStandard } = useGetStandardDetails(standardId)
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(controlId)

  const isLoading = isLoadingPolicy || isLoadingStandard || isLoadingControl

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">{homeElement}</BreadcrumbLink>
        </BreadcrumbItem>

        {pathNames.map((link, index) => {
          const href = `/${pathNames.slice(0, index + 1).join('/')}`
          let itemLink = toTitleCase(link.replaceAll('-', ' '))

          if (policyId && link === policyId && data?.internalPolicy) {
            itemLink = data.internalPolicy.name
          } else if (standardId && link === standardId && standardData?.standard) {
            itemLink = standardData.standard.shortName ?? 'Unknown'
          } else if (controlId && link === controlId && controlData?.control) {
            itemLink = controlData.control.refCode
          }

          if (index === pathNames.length - 1 && isLoading) {
            return (
              <BreadcrumbSeparator key="loading">
                <Loader size={16} className="animate-spin" />
              </BreadcrumbSeparator>
            )
          }

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href={href}>{itemLink}</BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
