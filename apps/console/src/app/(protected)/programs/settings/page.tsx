import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProgramSettingsUsers } from '@/components/pages/programs/settings/users/program-settings-users'
import { ProgramSettingsGroups } from '@/components/pages/programs/settings/groups/program-settings-groups'
import { ProgramSettingsImportControls } from '@/components/pages/programs/settings/program-settings-import-controls'
import { ProgramSettingsDangerZone } from '@/components/pages/programs/settings/danger-zone/program-settings-danger-zone'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Program Settings',
}

const ProgramSettingsPage = () => {
  return (
    <div className="space-y-6">
      <PageHeading heading="Program Settings" />
      <ProgramSettingsUsers />
      <ProgramSettingsGroups />
      <ProgramSettingsImportControls />
      <ProgramSettingsDangerZone />
    </div>
  )
}

export default ProgramSettingsPage
