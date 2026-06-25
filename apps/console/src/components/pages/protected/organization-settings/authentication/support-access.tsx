'use client'

import React from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Switch } from '@repo/ui/switch'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const SupportAccess = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationSetting(currentOrgId)
  const { mutateAsync: update } = useUpdateOrganizationSetting()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const settingId = data?.organization?.setting?.id
  const allowSupportAccess = !!data?.organization?.setting?.allowSupportAccess

  const onSwitchChange = async (checked: boolean) => {
    if (!settingId) return
    try {
      await update({
        updateOrganizationSettingId: settingId,
        input: { allowSupportAccess: checked },
      })
      await queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })
      successNotification({ title: 'Success', description: 'Support access setting updated successfully.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading support access...</p>

  return (
    <Panel>
      <PanelHeader
        heading="Openlane support access"
        subheading="Allow Openlane support staff to access this organization without a directory account. Actions are attributed to the acting support engineer."
        noBorder
      />
      <Switch checked={allowSupportAccess} onCheckedChange={onSwitchChange} />
    </Panel>
  )
}

export default SupportAccess
