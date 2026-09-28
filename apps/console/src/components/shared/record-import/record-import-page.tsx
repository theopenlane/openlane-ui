'use client'

import React, { use, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'
import Skeleton from '@/components/shared/skeleton/skeleton'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganization } from '@/hooks/useOrganization'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { isImpersonation } from '@/lib/authz/utils'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { type TAccessRole } from '@/types/authz'
import { RecordImportFlow } from './record-import-flow'
import { canImportWith, IMPORT_ROUTES, RETURN_TO_PARAM, type TImportableObjectType, type TImportRoute } from './lib/import-routes'
import type { TDestinationField, TImportAutomaticValue, TImportDestination, TMappedImport } from './lib/types'

export type TImportRoles = { roles: TAccessRole[] | undefined; isPending: boolean }

export type TRecordImportPageProps = {
  entityType: TImportableObjectType
  route?: TImportRoute
  roles?: TImportRoles
  destination?: TImportDestination
  fixedFields?: readonly TDestinationField[]
  automaticValues?: readonly TImportAutomaticValue[]
  notice?: React.ReactNode
  onImport: (mapped: TMappedImport) => Promise<unknown>
}

export const RecordImportSkeleton: React.FC = () => (
  <div role="status" aria-live="polite" aria-label="Loading import" className="flex flex-col gap-4">
    <Skeleton height={32} className="w-full max-w-[320px] rounded-md" />
    <Skeleton height={240} className="w-full rounded-lg" />
  </div>
)

export const RecordImportUnavailable: React.FC<{ message: React.ReactNode; backHref: string; backLabel: string }> = ({ message, backHref, backLabel }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnHref = sanitizeLoginRedirect(searchParams.get(RETURN_TO_PARAM), backHref)

  return (
    <div className="py-16 text-center text-muted-foreground">
      {message}
      <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(returnHref)}>
        {backLabel}
      </Button>
    </div>
  )
}

export const RecordImportPage: React.FC<TRecordImportPageProps> = ({ entityType, route: routeOverride, roles, destination, fixedFields, automaticValues, notice, onImport }) => {
  const route: TImportRoute = routeOverride ?? IMPORT_ROUTES[entityType]
  const { setCrumbs } = use(BreadcrumbContext)
  const { data: session } = useSession()
  const { currentOrgId } = useOrganization()
  const organizationRoles = useOrganizationRoles()
  const { roles: grantedRoles, isPending } = roles ?? { roles: organizationRoles.data?.roles, isPending: organizationRoles.isPending }

  const { listLabel, listHref, section } = route
  const sectionLabel = section?.label
  const sectionHref = section?.href

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, ...(sectionLabel ? [{ label: sectionLabel, href: sectionHref }] : []), { label: listLabel, href: listHref }, { label: 'Import' }])
  }, [setCrumbs, sectionLabel, sectionHref, listLabel, listHref])

  if (route.permission !== null && isPending && !isImpersonation(session)) return <RecordImportSkeleton />
  if (!canImportWith(route.permission, grantedRoles, session ?? null)) return <ProtectedArea />

  return (
    <RecordImportFlow
      key={currentOrgId ?? 'no-organization'}
      entityType={entityType}
      route={route}
      destination={destination}
      fixedFields={fixedFields}
      automaticValues={automaticValues}
      notice={notice}
      onImport={onImport}
    />
  )
}
