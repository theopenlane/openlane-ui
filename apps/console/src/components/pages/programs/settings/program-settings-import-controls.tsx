'use client'

import React from 'react'
import ImportControlsDialog from './program-settings-import-controls-dialog'
import { canEdit } from '@/lib/authz/utils'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAccountRole } from '@/lib/authz/access-api'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'

export const ProgramSettingsImportControls = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const { data: session } = useSession()
  const { data: permission } = useAccountRole(session, ObjectEnum.PROGRAM, programId)
  const editAllowed = canEdit(permission.roles)

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
