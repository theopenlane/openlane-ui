'use client'

import React, { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@repo/ui/button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { RecordImportPage, RecordImportSkeleton } from '@/components/shared/record-import/record-import-page'
import { IMPORT_ROUTES, vendorContactsImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { useCreateBulkCSVContact } from '@/lib/graphql-hooks/contact'
import { useEntity, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { UserFacingError } from '@/utils/graphQlErrorMatcher'

const VendorContactsImportPage: React.FC<{ vendorId: string }> = ({ vendorId }) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useEntity(vendorId)
  const { data: permission, isPending: isPermissionPending } = useAccountRoles(ObjectTypes.ENTITY, vendorId)
  const { mutateAsync: createBulkCSVContact } = useCreateBulkCSVContact()
  const { mutateAsync: updateEntity } = useUpdateEntity()
  const unlinkedContactIdsRef = useRef<string[] | null>(null)

  const vendor = data?.entity

  if (isPending) return <RecordImportSkeleton />

  if (isError || !vendor) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Vendor not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push(IMPORT_ROUTES[ObjectTypes.ENTITY].listHref)}>
          Back to Vendors
        </Button>
      </div>
    )
  }

  const vendorName = vendor.displayName || vendor.name || 'this vendor'

  const handleImport = async (file: File) => {
    const contactIds = unlinkedContactIdsRef.current ?? (await createBulkCSVContact({ input: file })).createBulkCSVContact?.contacts?.map((contact) => contact.id) ?? []

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
