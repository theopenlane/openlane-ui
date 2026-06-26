'use client'

import React, { useEffect, useState, use } from 'react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Switch } from '@repo/ui/switch'
import { type UpdateOrganizationSettingInput } from '@repo/codegen/src/schema'
import { isValidDomain } from '@/utils/strings'
import { DomainListEditor } from '@/components/shared/domain-list-editor/domain-list-editor'

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
    <>
      <Panel>
        <PanelHeader
          heading="Allowed domains"
          subheading="Restrict user logins to the organization by email domain. This does not apply to users logging in with SSO when configured. Do not add your company domain(s) that are used for SSO here if SSO is enforced. Any domain here will not be allowed to be excluded from SSO settings."
          noBorder
        />

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
      </Panel>

      <Panel>
        <PanelHeader heading="Auto-join organization" subheading="Allow users with verified email addresses that match allowed domains to automatically join the organization" noBorder />
        <Switch checked={allowAutoJoin} onCheckedChange={onSwitchChange} disabled={domainCount === 0} />
      </Panel>
    </>
  )
}

export default AllowedDomains
