'use client'

import React, { useEffect, useState, useContext } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { CirclePlus, X } from 'lucide-react'
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
  const [inputError, setInputError] = useState<string | null>(null)

  const settingId = data?.organization?.setting?.id
  const [domains, setDomains] = useState<string[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [allowAutoJoin, setAllowAutoJoin] = useState(false)
  const queryClient = useQueryClient()
  const { setCrumbs } = useContext(BreadcrumbContext)

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
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })
    }
  }

  const addDomain = (e: React.FormEvent) => {
    e.preventDefault()
    setInputError(null)

    const domain = newDomain.trim().toLowerCase()
    if (!domain) return

    if (!isValidDomain(domain)) {
      setInputError(`"${domain}" is not a valid domain.`)
      return
    }

    if (domains.includes(domain)) {
      setInputError(`"${domain}" is already in the list.`)
      return
    }

    setDomains((prev) => [...prev, domain])
    setNewDomain('')
  }

  const removeDomain = (domainToRemove: string) => {
    setDomains((prev) => {
      const updated = prev.filter((d) => d !== domainToRemove)
      return updated
    })
  }

  const saveChanges = () => {
    updateSetting({ allowedEmailDomains: domains, allowMatchingDomainsAutojoin: domains.length > 0 ? undefined : false }, 'Allowed domains updated successfully.')
  }

  const onSwitchChange = (checked: boolean) => {
    setAllowAutoJoin(checked)
    updateSetting({ allowMatchingDomainsAutojoin: checked }, 'Auto-join setting updated successfully.')
  }

  useEffect(() => {
    const apiDomains = data?.organization?.setting?.allowedEmailDomains ?? []
    setDomains(apiDomains)
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
          <div className="flex flex-col gap-4 mb-2">
            {domains.map((domain) => (
              <div key={domain} className="flex items-center gap-1">
                {domain}
                <button type="button" onClick={() => removeDomain(domain)} className="ml-1">
                  <X className="w-3 h-3 hover:text-red-500" />
                </button>
              </div>
            ))}
          </div>

          <form className="flex items-center gap-2 mt-4" onSubmit={addDomain}>
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

            <button type="submit">
              <CirclePlus size={16} className="text-brand cursor-pointer" />
            </button>
          </form>

          {inputError && <p className="mt-2 text-sm text-destructive">{inputError}</p>}

          <Button type="button" className="h-8 p-2 mt-4" variant="secondary" onClick={saveChanges} disabled={isPending}>
            Save
          </Button>
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
