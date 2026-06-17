'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { Search } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { useNotification } from '@/hooks/useNotification'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useAssignOrganizationRoles, useOrganizationResponsibilityRoles, useRemoveOrganizationRoles } from '@/lib/query-hooks/organization-roles'
import { type OrganizationRoleSubjectType } from '@/types/organization-roles'

type ManageAdditionalRolesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectType: OrganizationRoleSubjectType
  subjectIds: string[]
  subjectName?: string
  mode?: 'add' | 'remove'
  currentRoleNames?: string[]
  onSaved?: () => void
}

export const ManageAdditionalRolesDialog = ({ open, onOpenChange, subjectType, subjectIds, subjectName, mode = 'add', currentRoleNames, onSaved }: ManageAdditionalRolesDialogProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { data, isLoading } = useOrganizationResponsibilityRoles()
  const { mutateAsync: assignRoles, isPending: isAssigning } = useAssignOrganizationRoles()
  const { mutateAsync: removeRoles, isPending: isRemoving } = useRemoveOrganizationRoles()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const isManage = currentRoleNames !== undefined
  const isRemoveMode = mode === 'remove'
  const isPending = isAssigning || isRemoving

  const idByName = useMemo(() => new Map((data?.roles ?? []).map((role) => [role.name, role.id])), [data?.roles])
  const currentIds = useMemo(() => (currentRoleNames ?? []).map((name) => idByName.get(name)).filter((id): id is string => !!id), [currentRoleNames, idByName])
  const currentIdsKey = currentIds.join(',')
  const current = useMemo(() => new Set(currentIdsKey ? currentIdsKey.split(',') : []), [currentIdsKey])

  useEffect(() => {
    if (open) setSelected(new Set(currentIdsKey ? currentIdsKey.split(',') : []))
  }, [open, currentIdsKey])

  const roles = useMemo(() => {
    const all = data?.roles ?? []
    if (!debouncedSearch.trim()) return all
    const term = debouncedSearch.trim().toLowerCase()
    return all.filter((role) => role.name.toLowerCase().includes(term) || role.description.toLowerCase().includes(term))
  }, [data?.roles, debouncedSearch])

  const { toAdd, toRemove } = useMemo(() => {
    const selectedIds = Array.from(selected)
    return {
      toAdd: selectedIds.filter((id) => !current.has(id)),
      toRemove: Array.from(current).filter((id) => !selected.has(id)),
    }
  }, [selected, current])

  const canSave = isManage ? toAdd.length > 0 || toRemove.length > 0 : selected.size > 0

  const handleReset = () => {
    setTimeout(() => {
      setSearch('')
      setSelected(new Set())
    }, 200)
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) handleReset()
  }

  const toggleRole = (roleId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(roleId)
      } else {
        next.delete(roleId)
      }
      return next
    })
  }

  const subjectVars = subjectType === 'user' ? { userIds: subjectIds } : { groupIds: subjectIds }

  const handleSave = async () => {
    if (!canSave || subjectIds.length === 0) return

    try {
      if (isManage) {
        await Promise.all([toAdd.length > 0 ? assignRoles({ roles: toAdd, ...subjectVars }) : null, toRemove.length > 0 ? removeRoles({ roles: toRemove, ...subjectVars }) : null].filter(Boolean))
        successNotification({ title: 'Roles updated successfully' })
      } else if (isRemoveMode) {
        await removeRoles({ roles: Array.from(selected), ...subjectVars })
        successNotification({ title: 'Roles removed successfully' })
      } else {
        await assignRoles({ roles: Array.from(selected), ...subjectVars })
        successNotification({ title: 'Roles assigned successfully' })
      }
      onSaved?.()
      handleOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update roles',
      })
    }
  }

  const subjectCountLabel = subjectIds.length > 1 ? `${subjectIds.length} ${subjectType === 'user' ? 'members' : 'groups'}` : subjectName
  const addListLabel = isRemoveMode ? 'Select roles to remove' : isManage ? 'Additional Roles' : 'Add Additional Roles'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">{isRemoveMode ? 'Remove Additional Roles' : 'Manage Additional Roles'}</DialogTitle>
          {subjectCountLabel ? <DialogDescription>{subjectCountLabel}</DialogDescription> : null}
        </DialogHeader>

        <div className={isManage ? 'grid grid-cols-3 gap-6' : ''}>
          {isManage && (
            <div className="col-span-1 flex flex-col gap-2">
              <span className="text-sm font-medium">Current Additional Roles ({(currentRoleNames ?? []).length})</span>
              {currentRoleNames && currentRoleNames.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                  {currentRoleNames.map((name) => (
                    <Badge key={name} variant="select">
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">No additional roles assigned.</span>
              )}
            </div>
          )}

          <div className={isManage ? 'col-span-2 flex flex-col gap-3' : 'flex flex-col gap-3'}>
            <span className="text-sm font-medium">{addListLabel}</span>
            <Input icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roles" variant="searchTable" />
            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
              {isLoading ? (
                <span className="text-sm text-muted-foreground">Loading roles…</span>
              ) : roles.length === 0 ? (
                <span className="text-sm text-muted-foreground">No roles found.</span>
              ) : (
                roles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-start gap-2 text-sm">
                    <div className="mt-0.5">
                      <Checkbox checked={selected.has(role.id)} onCheckedChange={(checked) => toggleRole(role.id, !!checked)} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.name}</span>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <CancelButton onClick={() => handleOpenChange(false)} />
          <Button type="button" variant="primary" onClick={handleSave} disabled={!canSave || isPending}>
            {isRemoveMode ? 'Remove Roles' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
