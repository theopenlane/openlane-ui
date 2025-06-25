'use client'

import React, { useEffect, useState, useContext } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { CirclePlus, X } from 'lucide-react'

import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

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
  const queryClient = useQueryClient()
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Authentication', href: '/authentication' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    const apiDomains = data?.organization?.setting?.allowedEmailDomains
    if (Array.isArray(apiDomains)) {
      setDomains(apiDomains)
    }
  }, [data])

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
    setDomains((prev) => prev.filter((d) => d !== domainToRemove))
  }

  const saveChanges = async () => {
    if (!settingId) return
    try {
      await update({
        updateOrganizationSettingId: settingId,
        input: { allowedEmailDomains: domains },
      })
      await queryClient.invalidateQueries({
        queryKey: ['organizationSetting', currentOrgId],
      })
      successNotification({
        title: 'Domains saved',
        description: 'Allowed domains updated successfully.',
      })
    } catch (err) {
      errorNotification({
        title: 'Failed to save',
        description: 'An error occurred while saving domains.',
        gqlError: err,
      })
    }
  }

  if (isLoading) return <p className="text-sm text-muted">Loading allowed domains...</p>

  return (
    <div className="grid grid-cols-[165px_1fr] gap-20">
      <div>
        <h3 className="text-xl">Allowed domains</h3>
        <p className="text-sm">Restrict user logins to the organization by email domain</p>
      </div>

      <div>
        <div className="flex flex-col gap-4 mb-2">
          {domains.map((domain) => (
            <div key={domain} className="flex items-center gap-1">
              {domain}
              <button onClick={() => removeDomain(domain)} className="ml-1">
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

          <button>
            <CirclePlus size={16} className="text-brand cursor-pointer" />
          </button>
        </form>

        {inputError && <p className="mt-2 text-sm text-destructive">{inputError}</p>}

        <Button className="h-8 p-2 mt-4" variant="outline" onClick={saveChanges} disabled={isPending}>
          Save
        </Button>
      </div>
    </div>
  )
}

export default AllowedDomains
