'use client'

import React from 'react'
import ImportControlsDialog from './program-settings-import-controls-dialog'
import { canEdit } from '@/lib/authz/utils'
import { useParams } from 'next/navigation'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectTypes } from '@repo/codegen/src/type-names'

export const ProgramSettingsImportControls = () => {
  const { id } = useParams<{ id: string | undefined }>()

  const { data: permission } = useAccountRoles(ObjectTypes.PROGRAM, id)
  const editAllowed = canEdit(permission?.roles)

  if (!editAllowed) {
    return null
  }

  return (
    <section className="flex gap-14">
      <div className="w-48 shrink-0">
        <h3 className="font-normal text-xl mb-2">Import Controls</h3>
      </div>

      <div className="space-y-2 w-full">
        <p className="text-base">Import from frameworks or another programs</p>
        <ImportControlsDialog />
      </div>
    </section>
  )
}
