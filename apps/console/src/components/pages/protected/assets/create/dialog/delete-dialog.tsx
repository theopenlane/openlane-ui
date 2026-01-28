'use client'
import React, { useState } from 'react'
import { useNotification } from '@/hooks/useNotification'

import { Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { ObjectEnum } from '@/lib/authz/enums/object-enum.ts'
import { canDelete } from '@/lib/authz/utils.ts'
import { useRouter, useSearchParams } from 'next/navigation'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { useDeleteAsset } from '@/lib/graphql-hooks/assets'

const DeleteDialog: React.FC<{ assetName: string; assetId: string }> = ({ assetName, assetId }) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { data: permission } = useAccountRoles(ObjectEnum.ASSET, assetId)
  const [isOpen, setIsOpen] = useState(false)

  const { mutateAsync: deleteAsset } = useDeleteAsset()

  const handleDelete = async () => {
    if (!assetId) return

    try {
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('id')
      router.replace(`${window.location.pathname}?${newSearchParams.toString()}`)
      await deleteAsset({ deleteAssetId: assetId })
      successNotification({ title: `Asset deleted successfully.` })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsOpen(false)
    }
  }

  if (!canDelete(permission?.roles)) {
    return null
  }

  return (
    <>
      <Button icon={<Trash2 />} iconPosition="left" variant="secondary" onClick={() => setIsOpen(true)}>
        Delete
      </Button>
      <ConfirmationDialog
        title={`Delete Asset`}
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={handleDelete}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{assetName}</b> from the organization.
          </>
        }
      />
    </>
  )
}

export default DeleteDialog
