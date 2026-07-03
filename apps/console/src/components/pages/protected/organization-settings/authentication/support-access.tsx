'use client'

import React from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Headphones, Lock } from 'lucide-react'

const SupportAccess = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationSetting(currentOrgId)
  const { mutateAsync: update } = useUpdateOrganizationSetting()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const settingId = data?.organization?.setting?.id
  const allowSupportAccess = !!data?.organization?.setting?.allowSupportAccess

  const onToggle = async () => {
    if (!settingId) return
    try {
      await update({
        updateOrganizationSettingId: settingId,
        input: { allowSupportAccess: !allowSupportAccess },
      })
      await queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })
      successNotification({ title: 'Success', description: 'Support access setting updated successfully.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading support access...</p>

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Headphones className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1.5">
              <h3 className="font-semibold">Openlane Support Access</h3>
              <p className="text-sm text-muted-foreground pr-10">
                Allow Openlane support engineers to temporarily access your organization to assist with troubleshooting. All actions are logged and attributed. Access can be removed at anytime.
              </p>
              <Badge variant={allowSupportAccess ? 'green' : 'secondary'}>{allowSupportAccess ? '● Enabled' : '● Disabled'}</Badge>
            </div>
            <Button variant={allowSupportAccess ? 'destructive' : 'secondary'} onClick={onToggle} className="shrink-0">
              <Lock className="h-4 w-4 mr-2" />
              {allowSupportAccess ? 'Revoke Access' : 'Enable Access'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportAccess
