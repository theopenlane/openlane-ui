import React from 'react'
import Link from 'next/link'
import { type Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProgramSettingsUsers } from '@/components/pages/protected/programs/[id]/settings/users/program-settings-users'
import { ProgramSettingsGroups } from '@/components/pages/protected/programs/[id]/settings/groups/program-settings-groups'
import { ProgramSettingsImportControls } from '@/components/pages/protected/programs/[id]/settings/program-settings-import-controls'
import { ProgramSettingsDangerZone } from '@/components/pages/protected/programs/[id]/settings/danger-zone/program-settings-danger-zone'

export const metadata: Metadata = {
  title: 'Program Settings',
}

const ProgramSettingsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return (
    <div className="space-y-6">
      <Link href={`/programs/${encodeURIComponent(id)}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Program
      </Link>
      <PageHeading heading="Program Settings" />
      <ProgramSettingsUsers />
      <ProgramSettingsGroups />
      <ProgramSettingsImportControls />
      <ProgramSettingsDangerZone />
    </div>
  )
}

export default ProgramSettingsPage
