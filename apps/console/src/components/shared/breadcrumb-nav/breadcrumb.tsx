'use client'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@repo/ui/breadcrumb'
import { ChevronRight, Loader } from 'lucide-react'
import React from 'react'
import { toTitleCase } from '@/components/shared/lib/strings'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { useGetInternalPolicyDetailsById } from '@/lib/graphql-hooks/policy'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolById } from '@/lib/graphql-hooks/subcontrol'
import { useGetProcedureDetailsById } from '@/lib/graphql-hooks/procedures'
import { useGetProgramBasicInfo } from '@/lib/graphql-hooks/programs'

type TBreadCrumbProps = {
  homeElement?: string
}

export const BreadcrumbNavigation = ({ homeElement = 'Home' }: TBreadCrumbProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = useParams()

  const pathNames = pathname.split('/').filter(Boolean)

  const policyId = pathNames.includes('policies') ? (params.id as string) : null
  const standardId = pathNames.includes('standards') ? (params.id as string) : null
  const controlId = pathNames.includes('controls') ? (params.id as string) : null
  const procedureId = pathNames.includes('procedures') ? (params.id as string) : null
  const subcontrolId = params.subcontrolId as string | undefined
  const programId = pathname.startsWith('/programs') ? searchParams.get('id') : null

  const { data: policyData, isLoading: isLoadingPolicy } = useGetInternalPolicyDetailsById(policyId)
  const { data: procedureData, isLoading: isLoadingProcedure } = useGetProcedureDetailsById(procedureId)
  const { data: standardData, isLoading: isLoadingStandard } = useGetStandardDetails(standardId)
  const { data: controlData, isLoading: isLoadingControl } = useGetControlById(controlId)
  const { data: subcontrolData, isLoading: isLoadingSubcontrol } = useGetSubcontrolById(subcontrolId)
  const { data: programData, isLoading: isLoadingProgram } = useGetProgramBasicInfo(programId || null)
  const isLoading = isLoadingPolicy || isLoadingStandard || isLoadingControl || isLoadingSubcontrol || isLoadingProcedure || isLoadingProgram

  const breadcrumbs: { name: string; url?: string }[] = [{ name: homeElement, url: '/dashboard' }]

  if (pathname.startsWith('/programs')) {
    breadcrumbs.push({ name: 'Programs', url: '/programs' })

    if (programData) {
      breadcrumbs.push({
        name: programData.program?.name ?? 'Unknown Program',
      })
    }
  } else if (pathname.startsWith('/policies')) {
    breadcrumbs.push({ name: 'Policies', url: '/policies' })

    if (policyData?.internalPolicy) {
      breadcrumbs.push({
        name: policyData.internalPolicy.name,
      })
    }
  } else if (pathname.startsWith('/standards')) {
    breadcrumbs.push({ name: 'Standards', url: '/standards' })

    if (standardData?.standard) {
      breadcrumbs.push({
        name: standardData.standard.shortName ?? 'Unknown Standard',
      })
    }
  } else if (pathname.startsWith('/controls')) {
    breadcrumbs.push({ name: 'Controls', url: '/controls' })

    if (controlId && controlData?.control) {
      breadcrumbs.push({
        name: controlData.control.refCode,
        url: `/controls/${controlData.control.id}`,
      })
    }
    if (subcontrolId && subcontrolData && controlData) {
      breadcrumbs.push({
        name: subcontrolData.subcontrol.refCode,
      })
    }
  } else if (pathname.startsWith('/procedures')) {
    breadcrumbs.push({ name: 'Procedures', url: '/procedures' })

    if (procedureData?.procedure) {
      breadcrumbs.push({
        name: procedureData.procedure.name,
      })
    }
  } else {
    pathNames.forEach((link, index) => {
      const href = `/${pathNames.slice(0, index + 1).join('/')}`
      const exists = breadcrumbs.find((crumb) => crumb.url === href)
      if (!exists) {
        breadcrumbs.push({ name: toTitleCase(link.replaceAll('-', ' ')), url: href })
      }
    })
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1

          return (
            <React.Fragment key={index}>
              <BreadcrumbSeparator>
                <ChevronRight size={16} />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast && isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin" />
                  </div>
                ) : isLast || !crumb.url ? (
                  <span className="font-medium text-foreground">{crumb.name}</span>
                ) : (
                  <BreadcrumbLink href={crumb.url}>{crumb.name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
