'use client'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@repo/ui/breadcrumb'
import { ChevronRight, Loader } from 'lucide-react'
import React from 'react'
import { toTitleCase } from '@/components/shared/lib/strings'
import { useParams, usePathname } from 'next/navigation'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures'

type TBreadCrumbProps = {
  homeElement?: string
}

export const BreadcrumbNavigation = ({ homeElement = 'Home' }: TBreadCrumbProps) => {
  const pathname = usePathname()
  const params = useParams()
  const pathNames = pathname.split('/').filter(Boolean)

  // Identify if the path is for a policy or procedure
  const isPolicy = pathNames.includes('policies')
  const isProcedure = pathNames.includes('procedures')

  const policyId = isPolicy ? (params.id as string) : null
  const procedureId = isProcedure ? (params.id as string) : null

  const { data: policyData, isFetching: isFetchingPolicy } = useGetInternalPolicyDetailsById(policyId)
  const { data: procedureData, isFetching: isFetchingProcedure } = useGetProcedureDetailsById(procedureId)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">{homeElement}</BreadcrumbLink>
        </BreadcrumbItem>

        {pathNames.map((link, index) => {
          const href = `/${pathNames.slice(0, index + 1).join('/')}`
          let itemLink = toTitleCase(link.replaceAll('-', ' '))

          // Replace policy/procedure ID with fetched name
          if (policyId && link === policyId && policyData?.internalPolicy) {
            itemLink = policyData.internalPolicy.name
          }
          if (procedureId && link === procedureId && procedureData?.procedure) {
            itemLink = procedureData.procedure.name
          }

          // Add spinner to last breadcrumb if it's fetching
          const isFetching = index === pathNames.length - 1 && (isFetchingPolicy || isFetchingProcedure)
          if (isFetching) {
            return <Loader key={href} />
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
