'use client'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@repo/ui/breadcrumb'
import { ChevronRight, Loader } from 'lucide-react'
import React from 'react'
import { toTitleCase } from '@/components/shared/lib/strings'
import { useParams, usePathname } from 'next/navigation'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures.ts'

type TBreadCrumbProps = {
  homeElement?: string
}

export const BreadcrumbNavigation = ({ homeElement = 'Home' }: TBreadCrumbProps) => {
  const pathname = usePathname()
  const params = useParams()
  const pathNames = pathname.split('/').filter(Boolean)

  const policyId = pathNames.includes('policies') ? (params.id as string) : null
  const standardId = pathNames.includes('standards') ? (params.id as string) : null
  const controlId = pathNames.includes('controls') ? (params.id as string) : null
  const procedureId = pathNames.includes('procedures') ? (params.id as string) : null
  const subcontrolId = params.subcontrolId as string | undefined

  const { data, isLoading: isLoadingPolicy } = useGetInternalPolicyDetailsById(policyId)
  const { data: procedureData, isLoading: isLoadingProcedure } = useGetProcedureDetailsById(procedureId)
  const { data: standardData, isLoading: isLoadingStandard } = useGetStandardDetails(standardId)
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(controlId)
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(subcontrolId)

  const isLoading = isLoadingPolicy || isLoadingStandard || isLoadingControl || isLoadingSubcontrol || isLoadingProcedure

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">{homeElement}</BreadcrumbLink>
        </BreadcrumbItem>

        {pathNames.map((link, index) => {
          const href = `/${pathNames.slice(0, index + 1).join('/')}`
          let itemLink = toTitleCase(link.replaceAll('-', ' '))

          // Show dynamic names based on matched segments
          if (link === policyId && data?.internalPolicy) {
            itemLink = data.internalPolicy.name
          } else if (link === standardId && standardData?.standard) {
            itemLink = standardData.standard.shortName ?? 'Unknown'
          } else if (link === controlId && controlData?.control) {
            itemLink = controlData.control.refCode
          } else if (link === subcontrolId && subcontrolData?.subcontrol) {
            itemLink = subcontrolData.subcontrol.refCode
          } else if (link === procedureId && procedureData?.procedure) {
            itemLink = procedureData.procedure.name
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
