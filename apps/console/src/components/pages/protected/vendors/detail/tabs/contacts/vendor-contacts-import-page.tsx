'use client'

import React, { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage, RecordImportUnavailable } from '@/components/shared/record-import/record-import-page'
import { RecordImportSkeleton } from '@/components/shared/record-import/import-page-gate'
import { IMPORT_ROUTES, vendorContactsImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { type TMappedImport } from '@/components/shared/record-import/lib/types'
import { useCreateBulkCSVContact } from '@/lib/graphql-hooks/contact'
import { useEntity, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

const VendorContactsImportPage: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useEntity(vendorId)
  const { data: permission, isPending: isPermissionPending } = useAccountRoles(ObjectTypes.ENTITY, vendorId)
  const { mutateAsync: createBulkCSVContact } = useCreateBulkCSVContact()
  const { mutateAsync: updateEntity } = useUpdateEntity()
  const unlinkedContactIdsRef = useRef<string[] | null>(null)

  const vendor = data?.entity

  if (isPending) return <RecordImportSkeleton />

  if (isError || !vendor) {
    return <RecordImportUnavailable message={<p>Vendor not found.</p>} backHref={IMPORT_ROUTES[ObjectTypes.ENTITY].listHref} backLabel="Back to Vendors" />
  }

  const vendorName = vendor.displayName || vendor.name || 'this vendor'

  const handleImport = async (mapped: TMappedImport) => {
    const contactIds = unlinkedContactIdsRef.current ?? (await createBulkCSVContact({ input: mapped.toFile() })).createBulkCSVContact?.contacts?.map((contact) => contact.id) ?? []

    if (contactIds.length > 0) {
      unlinkedContactIdsRef.current = contactIds
      try {
        await updateEntity({ updateEntityId: vendorId, input: { addContactIDs: contactIds } })
      } catch (error) {
        queryClient.invalidateQueries({ queryKey: ['contacts'] })
        throw new UserFacingError(
          `${contactIds.length} contacts were created but could not be linked to ${vendorName}. Select Import again to retry linking them — your file will not be imported a second time.`,
          { cause: error },
        )
      }
    }

    unlinkedContactIdsRef.current = null
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
  }

  return (
    <RecordImportPage
      entityType={ObjectTypes.CONTACT}
      route={vendorContactsImportRoute(vendorId, vendorName)}
      roles={{ roles: permission?.roles, isPending: isPermissionPending }}
      onImport={handleImport}
    />
  )
}

export default VendorContactsImportPage
