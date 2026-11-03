'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronDown, FileSpreadsheet, Link2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { type GetStandardDetailsQuery } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import Menu from '@/components/shared/menu/menu'
import { MenuActionItem } from '@/components/shared/menu/menu-action-item'
import DetailHeaderActions from '@/components/shared/detail-header-actions/detail-header-actions'
import { deleteMenuAction } from '@/components/shared/crud-base/slideout-header'
import { elementAnchor } from '@/components/shared/element-anchor/element-anchor'
import { standardControlsImportRoute } from '@/components/shared/record-import/lib/import-routes'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { withReturnTo } from '@/utils/return-to'
import { EditFrameworkDialog } from './edit-framework-dialog'
import { LinkControlsDialog } from './link-controls-dialog'
import { STANDARDS_CATALOG_HREF, standardDisplayName, standardHref } from './custom-framework'
import { useDeleteCustomFramework } from './hooks/use-delete-custom-framework'

type TCustomFrameworkHeaderActionsProps = {
  standard: NonNullable<GetStandardDetailsQuery['standard']>
}

export const CustomFrameworkHeaderActions: React.FC<TCustomFrameworkHeaderActionsProps> = ({ standard }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const { data: permission } = useAccountRoles(ObjectTypes.STANDARD, standard.id)
  const { successNotification, errorNotification } = useNotification()
  const { deleteFramework, isDeleting } = useDeleteCustomFramework()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isLinkOpen, setIsLinkOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const standardName = standardDisplayName(standard)
  const controlCount = standard.controls.totalCount
  const canEditFramework = canEdit(permission?.roles, session)
  const canDeleteFramework = canDelete(permission?.roles)
  const importHref = withReturnTo(standardControlsImportRoute(standard.id, standardName).href, standardHref(standard.id))

  const handleDelete = async () => {
    try {
      await deleteFramework(standard.id)
      successNotification({ title: 'Framework deleted', description: controlCount ? `Its ${pluralizeWithCount(controlCount, 'control')} stay in your organization.` : undefined })
      setIsDeleteOpen(false)
      router.push(STANDARDS_CATALOG_HREF)
    } catch (error) {
      errorNotification({ title: 'Could not delete the framework', description: parseErrorMessage(error) })
    }
  }

  return (
    <>
      <DetailHeaderActions
        onEdit={canEditFramework ? () => setIsEditOpen(true) : undefined}
        editLabel="Edit framework details"
        actions={
          canEditFramework && (
            <Menu
              triggerAnchor={elementAnchor(ObjectTypes.STANDARD, 'add-controls')}
              trigger={
                <Button type="button" icon={<ChevronDown size={16} />}>
                  Add controls
                </Button>
              }
              content={
                <>
                  <MenuActionItem action={{ key: 'import', label: 'Import from CSV', icon: <FileSpreadsheet size={16} />, href: importHref }} />
                  <MenuActionItem action={{ key: 'link', label: 'Link existing controls', icon: <Link2 size={16} />, onClick: () => setIsLinkOpen(true) }} />
                </>
              }
            />
          )
        }
        menuActions={[canDeleteFramework && deleteMenuAction(() => setIsDeleteOpen(true))]}
      />
      <EditFrameworkDialog standard={standard} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <LinkControlsDialog standardId={standard.id} standardName={standardName} open={isLinkOpen} onOpenChange={setIsLinkOpen} />
      <ConfirmationDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        loading={isDeleting}
        title={`Delete ${standardName}?`}
        description={
          controlCount
            ? `Its ${pluralizeWithCount(controlCount, 'control')} are unlinked first and stay in your organization. This cannot be undone.`
            : 'The framework is removed from the Standards Catalog. This cannot be undone.'
        }
        confirmationText="Delete"
        confirmationTextVariant="destructive"
      />
    </>
  )
}
