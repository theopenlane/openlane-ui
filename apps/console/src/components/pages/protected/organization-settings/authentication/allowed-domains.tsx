'use client'

import React, { useEffect, useState, useContext } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { PlusIcon, Trash2 } from 'lucide-react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Switch } from '@repo/ui/switch'
import { UpdateOrganizationSettingInput } from '@repo/codegen/src/schema'

const isValidDomain = (domain: string) => /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/.test(domain)

const AllowedDomains = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationSetting(currentOrgId)
  const { mutateAsync: update, isPending } = useUpdateOrganizationSetting()
  const { successNotification, errorNotification } = useNotification()
  const [newDomain, setNewDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [allowAutoJoin, setAllowAutoJoin] = useState(false)
  const queryClient = useQueryClient()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const settingId = data?.organization?.setting?.id
  const domains = data?.organization?.setting?.allowedEmailDomains ?? []

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

    await updateSetting({ allowedEmailDomains: [...domains, trimmed], allowMatchingDomainsAutojoin: true }, 'Allowed domains updated successfully.')
    setNewDomain('')
  }

  const removeDomain = async (domainToRemove: string) => {
    const updated = domains.filter((d) => d !== domainToRemove)
    await updateSetting({ allowedEmailDomains: updated, allowMatchingDomainsAutojoin: updated.length > 0 ? undefined : false }, 'Domain removed successfully.')
  }

  const onSwitchChange = async (checked: boolean) => {
    setAllowAutoJoin(checked)
    await updateSetting({ allowMatchingDomainsAutojoin: checked }, 'Auto-join setting updated successfully.')
  }

  useEffect(() => {
    setAllowAutoJoin(!!data?.organization?.setting?.allowMatchingDomainsAutojoin)
  }, [data])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Authentication', href: '/authentication' },
    ])
  }, [setCrumbs])

  if (isLoading) return <p className="text-sm text-muted">Loading allowed domains...</p>

  const domainCount = domains.length

  return (
    <>
      <Panel>
        <PanelHeader heading="Allowed domains" subheading="Restrict user logins to the organization by email domain" noBorder />

        <div>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              className="h-7 p-2.5"
              placeholder="example.com"
              value={newDomain}
              onChange={(e) => {
                setNewDomain(e.target.value)
                if (inputError) setInputError(null)
              }}
            />

            <Button type="button" className="h-8 p-2 " variant="secondary" onClick={saveChanges} disabled={isPending} icon={<PlusIcon />} iconPosition="left">
              Add Domain
            </Button>
          </div>

          {inputError && <p className="mt-2 text-sm text-destructive">{inputError}</p>}

          <div className="flex gap-3 mb-2 mt-6">
            {domains.map((domain) => (
              <div key={domain} className="flex items-center gap-1 bg-btn-secondary size-fit px-2 rounded-sm border border-muted">
                {domain}
                <button type="button" onClick={() => removeDomain(domain)} className="ml-1">
                  <Trash2 size={14} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader heading="Auto-join organization" subheading="Allow users with verified email addresses that match allowed domains to automatically join the organization" noBorder />
        <Switch checked={allowAutoJoin} onCheckedChange={onSwitchChange} disabled={domainCount === 0} />
      </Panel>
    </>
  )
}

export default AllowedDomains
