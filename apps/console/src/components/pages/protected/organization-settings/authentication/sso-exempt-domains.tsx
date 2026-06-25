'use client'

import React, { useState } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { PlusIcon, Trash2 } from 'lucide-react'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type UpdateOrganizationSettingInput } from '@repo/codegen/src/schema'

const isValidDomain = (domain: string) => /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/.test(domain)

const SSOExemptDomains = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationSetting(currentOrgId)
  const { mutateAsync: update, isPending } = useUpdateOrganizationSetting()
  const { successNotification, errorNotification } = useNotification()
  const [newDomain, setNewDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const settingId = data?.organization?.setting?.id
  const domains = data?.organization?.setting?.ssoExemptDomains ?? []
  const allowedDomains = data?.organization?.setting?.allowedEmailDomains ?? []

  const updateSetting = async (input: UpdateOrganizationSettingInput, successMsg: string) => {
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

  const addDomain = async () => {
    const trimmed = newDomain.trim().toLowerCase()
    if (!trimmed) return

    if (!isValidDomain(trimmed)) {
      setInputError(`"${trimmed}" is not a valid domain.`)
      return
    }

    if (domains.includes(trimmed)) {
      setInputError(`"${trimmed}" is already exempt.`)
      return
    }

    if (allowedDomains.includes(trimmed)) {
      setInputError(`"${trimmed}" is in your allowed domains, so it can't also be SSO-exempt. Remove it from allowed domains first.`)
      return
    }

    await updateSetting({ ssoExemptDomains: [...domains, trimmed] }, 'Exempt domains updated successfully.')
    setNewDomain('')
  }

  const removeDomain = async (domainToRemove: string) => {
    const updated = domains.filter((d) => d !== domainToRemove)
    await updateSetting({ ssoExemptDomains: updated }, 'Domain removed successfully.')
  }

  if (isLoading) return <p className="text-sm text-muted">Loading exempt domains...</p>

  return (
    <Panel>
      <PanelHeader
        heading="SSO exempt domains"
        subheading="Existing members whose email matches one of these domains skip the SSO login redirect. A domain cannot also appear in allowed domains."
        noBorder
      />

      <div>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            className="h-7 p-2.5"
            placeholder="auditor.com"
            value={newDomain}
            onChange={(e) => {
              setNewDomain(e.target.value)
              if (inputError) setInputError(null)
            }}
          />

          <Button type="button" className="h-8 p-2" variant="secondary" onClick={addDomain} disabled={isPending} icon={<PlusIcon />} iconPosition="left">
            Add Domain
          </Button>
        </div>

        {inputError && <p className="mt-2 text-sm text-destructive">{inputError}</p>}

        <div className="flex flex-wrap gap-3 mb-2 mt-6">
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
  )
}

export default SSOExemptDomains
