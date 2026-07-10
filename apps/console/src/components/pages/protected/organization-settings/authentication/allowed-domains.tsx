'use client'

import React, { useEffect, useState, use } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { type UpdateOrganizationSettingInput } from '@repo/codegen/src/schema'
import { isValidDomain } from '@/utils/strings'
import { DomainListEditor } from '@/components/shared/domain-list-editor/domain-list-editor'
import { Lock, UserCheck } from 'lucide-react'

const AllowedDomains = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationSetting(currentOrgId)
  const { mutateAsync: update, isPending } = useUpdateOrganizationSetting()
  const { successNotification, errorNotification } = useNotification()
  const [newDomain, setNewDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { setCrumbs } = use(BreadcrumbContext)

  const settingId = data?.organization?.setting?.id
  const domains = data?.organization?.setting?.allowedEmailDomains ?? []
  const exemptDomains = data?.organization?.setting?.ssoExemptDomains ?? []
  const allowAutoJoin = !!data?.organization?.setting?.allowMatchingDomainsAutojoin

  const updateSetting = async (input: UpdateOrganizationSettingInput, successMsg = 'Settings saved successfully.') => {
    if (!settingId) return
    try {
      await update({
        updateOrganizationSettingId: settingId,
        input,
      })
      await queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })
      successNotification({ title: 'Success', description: successMsg })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const saveChanges = async () => {
    const trimmed = newDomain.trim().toLowerCase()
    if (!trimmed) return

    if (!isValidDomain(trimmed)) {
      setInputError(`"${trimmed}" is not a valid domain.`)
      return
    }

    if (domains.includes(trimmed)) {
      setInputError(`"${trimmed}" is already allowed.`)
      return
    }

    if (exemptDomains.includes(trimmed)) {
      setInputError(`"${trimmed}" is an SSO-exempt domain, so it can't also be an allowed domain. Remove it from SSO-exempt domains first.`)
      return
    }

    await updateSetting({ allowedEmailDomains: [...domains, trimmed], allowMatchingDomainsAutojoin: true }, 'Allowed domains updated successfully.')
    setNewDomain('')
  }

  const removeDomain = async (domainToRemove: string) => {
    const updated = domains.filter((d) => d !== domainToRemove)
    await updateSetting({ allowedEmailDomains: updated, allowMatchingDomainsAutojoin: updated.length > 0 ? undefined : false }, 'Domain removed successfully.')
  }

  const onSwitchChange = async (checked: boolean) => {
    await updateSetting({ allowMatchingDomainsAutojoin: checked }, 'Auto-join setting updated successfully.')
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings/general-settings' },
      { label: 'Authentication', href: '/authentication' },
    ])
  }, [setCrumbs])

  if (isLoading) return <p className="text-sm text-muted">Loading allowed domains...</p>

  const domainCount = domains.length

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h3 className="font-semibold">Auto Join</h3>
              <p className="text-sm text-muted-foreground">Automatically allow users with verified email addresses from approved domains to join this organization.</p>
              <Badge variant={allowAutoJoin ? 'green' : 'secondary'}>{allowAutoJoin ? '● Enabled' : '● Disabled'}</Badge>
            </div>
            <Button variant={allowAutoJoin ? 'destructive' : 'secondary'} onClick={() => onSwitchChange(!allowAutoJoin)} disabled={domainCount === 0} className="shrink-0">
              <Lock className="h-4 w-4 mr-2" />
              {allowAutoJoin ? 'Disable Auto Join' : 'Enable Auto Join'}
            </Button>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="mb-3 space-y-0.5">
              <h4 className="text-sm font-medium">Allowed domains</h4>
              <p className="text-xs text-muted-foreground">Users with a verified email from these domains can automatically join</p>
              {domainCount === 0 && <p className="text-xs text-muted-foreground">Add a domain below to enable auto-join.</p>}
            </div>
            <DomainListEditor
              domains={domains}
              newDomain={newDomain}
              onNewDomainChange={(value) => {
                setNewDomain(value)
                if (inputError) setInputError(null)
              }}
              onAdd={saveChanges}
              onRemove={removeDomain}
              error={inputError}
              isPending={isPending}
              addLabel="Add Domain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AllowedDomains
