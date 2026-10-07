'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { readReturnTo } from '@/utils/return-to'
import { RecordImportFlow } from './record-import-flow'
import { ImportPageGate, type TImportRoles } from './import-page-gate'
import { IMPORT_ROUTES, type TImportableObjectType, type TImportRoute } from './lib/import-routes'
import type { TDestinationField, TImportAutomaticValue, TImportDestination, TMappedImport } from './lib/types'

export type TRecordImportPageProps = {
  entityType: TImportableObjectType
  route?: TImportRoute
  roles?: TImportRoles
  destination?: TImportDestination
  fixedFields?: readonly TDestinationField[]
  automaticValues?: readonly TImportAutomaticValue[]
  onImport: (mapped: TMappedImport) => Promise<unknown>
}

export const RecordImportUnavailable: React.FC<{ message: React.ReactNode; backHref: string; backLabel: string }> = ({ message, backHref, backLabel }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnHref = readReturnTo(searchParams, backHref)

  return (
    <div className="py-16 text-center text-muted-foreground">
      {message}
      <Button variant="secondary" className="mt-4" icon={<ArrowLeft size={16} />} iconPosition="left" onClick={() => router.push(returnHref)}>
        {backLabel}
      </Button>
    </div>
  )
}

export const RecordImportPage: React.FC<TRecordImportPageProps> = ({ entityType, route: routeOverride, roles, destination, fixedFields, automaticValues, onImport }) => {
  const route = routeOverride ?? IMPORT_ROUTES[entityType]

  return (
    <ImportPageGate route={route} roles={roles}>
      <RecordImportFlow entityType={entityType} route={route} destination={destination} fixedFields={fixedFields} automaticValues={automaticValues} onImport={onImport} />
    </ImportPageGate>
  )
}
