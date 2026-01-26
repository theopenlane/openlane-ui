'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { PanelRightClose } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { AssignPermissionsDialog } from './assign-permission-dialog'
import { useParams, usePathname } from 'next/navigation'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups'
import { useGroupColumns } from './permissions-table-config'
import { Group } from './assign-permissions-table-config'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/policy'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedures'
import { TableKeyEnum } from '@repo/ui/table-key'

export function ManagePermissionSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname()
  const isProcedurePage = pathname.includes('/procedures')

  const queryClient = useQueryClient()
  const { id } = useParams<{ id: string }>()
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [groupToRemove, setGroupToRemove] = useState<Group | null>(null)

  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { mutateAsync: updateProcedure } = useUpdateProcedure()

  const { errorNotification, successNotification } = useNotification()

  const config = useMemo(() => {
    if (isProcedurePage) {
      return {
        where: {
          hasProcedureEditorsWith: [
            {
              idIn: [id],
            },
          ],
        },
        invalidate: () => {
          queryClient.invalidateQueries({ queryKey: ['groups'] })
          queryClient.invalidateQueries({ queryKey: ['procedures'] })
        },
        update: async () => {
          await updateProcedure({
            updateProcedureId: id,
            input: {
              removeEditorIDs: [groupToRemove?.id || ''],
            },
          })
        },
      }
    }
    return {
      where: {
        hasInternalPolicyEditorsWith: [
          {
            idIn: [id],
          },
        ],
      },
      invalidate: () => {
        queryClient.invalidateQueries({ queryKey: ['groups'] })
        queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
      },
      update: async () => {
        await updatePolicy({
          updateInternalPolicyId: id,
          input: {
            removeEditorIDs: [groupToRemove?.id || ''],
          },
        })
      },
    }
  }, [id, isProcedurePage, queryClient, groupToRemove?.id, updatePolicy, updateProcedure])

  const { isLoading, groups } = useGetAllGroups({ where: config.where })

  const handleRemoveGroup = (group: Group) => {
    setGroupToRemove(group)
    setDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!groupToRemove) return
    try {
      await config.update()
      successNotification({
        title: 'Permission removed',
        description: `${groupToRemove.name} no longer has edit access.`,
      })
      config.invalidate()
    } catch {
      errorNotification({
        title: 'Failed to remove permission',
      })
    } finally {
      setDialogOpen(false)
      setGroupToRemove(null)
    }
  }

  const columns = useGroupColumns({ onRemoveGroup: handleRemoveGroup })

  return (
    <>
      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDelete}
        title={`Remove ${groupToRemove?.name}?`}
        description={
          <>
            This will revoke editing permission for <b>{groupToRemove?.name}</b>.
          </>
        }
        confirmationText="Remove"
        confirmationTextVariant="destructive"
      />
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex flex-col"
          header={
            <SheetHeader className="flex justify-between items-center flex-row text-2xl">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => onOpenChange(false)} />
              <Button className="h-8 p-2" onClick={() => setAssignDialogOpen(true)}>
                Assign
              </Button>
            </SheetHeader>
          }
        >
          <SheetTitle>Manage permission</SheetTitle>
          <SheetDescription>
            Grant specific groups within your organization permission to edit this policy. Members of these groups will be able to update the policy’s content and metadata.
          </SheetDescription>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Group list</h3>
            <DataTable
              columns={columns}
              data={groups}
              showFilter={false}
              showVisibility={false}
              loading={isLoading}
              pagination={null}
              onPaginationChange={() => {}}
              tableKey={TableKeyEnum.POLICY_PROCEDURE_MANAGE_PERMISSION}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AssignPermissionsDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} />
    </>
  )
}
