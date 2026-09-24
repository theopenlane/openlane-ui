'use client'

import React, { use, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganization } from '@/hooks/useOrganization'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { isImpersonation } from '@/lib/authz/utils'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { type TAccessRole } from '@/types/authz'
import { RecordImportFlow } from './record-import-flow'
import { canImportWith, IMPORT_ROUTES, type TImportableObjectType, type TImportRoute } from './lib/import-routes'

export type TImportRoles = { roles: TAccessRole[] | undefined; isPending: boolean }

export type TRecordImportPageProps = {
  entityType: TImportableObjectType
  route?: TImportRoute
  roles?: TImportRoles
  onImport: (file: File) => Promise<unknown>
}

export const RecordImportSkeleton: React.FC = () => (
  <div role="status" aria-live="polite" aria-label="Loading import" className="flex flex-col gap-4">
    <Skeleton height={32} className="w-full max-w-[320px] rounded-md" />
    <Skeleton height={240} className="w-full rounded-lg" />
  </div>
)

export const RecordImportPage: React.FC<TRecordImportPageProps> = ({ entityType, route: routeOverride, roles, onImport }) => {
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

  return <RecordImportFlow key={currentOrgId ?? 'no-organization'} entityType={entityType} route={route} onImport={onImport} />
}
