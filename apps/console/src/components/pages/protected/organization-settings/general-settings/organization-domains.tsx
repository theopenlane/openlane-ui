'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Pencil } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { DomainListEditor } from '@/components/shared/domain-list-editor/domain-list-editor'
import { toHostname } from '@/utils/normalizeUrl'
import { isValidDomain } from '@/utils/strings'

const OrganizationDomains = () => {
  const { currentOrgId } = useOrganization()
  const { data, isLoading } = useGetOrganizationSetting(currentOrgId)
  const { mutateAsync: update, isPending } = useUpdateOrganizationSetting()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const settingId = data?.organization?.setting?.id
  const domains = data?.organization?.setting?.domains ?? []

  const saveDomains = async (updated: string[], successMessage: string) => {
    if (!settingId) return
    try {
      await update({
        updateOrganizationSettingId: settingId,
        input: updated.length > 0 ? { domains: updated } : { clearDomains: true },
      })
      await queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })
      await queryClient.invalidateQueries({ queryKey: ['organizationDomains', currentOrgId] })
      successNotification({ title: 'Success', description: successMessage })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const addDomain = async () => {
    const candidate = toHostname(newDomain)
    if (!candidate) return

    if (!isValidDomain(candidate)) {
      setInputError(`"${newDomain.trim()}" is not a valid domain.`)
      return
    }

    if (domains.includes(candidate)) {
      setInputError(`"${candidate}" is already associated with this organization.`)
      return
    }

    await saveDomains([...domains, candidate], 'Domain added successfully.')
    setNewDomain('')
  }

  const removeDomain = async (domainToRemove: string) => {
    await saveDomains(
      domains.filter((domain) => domain !== domainToRemove),
      'Domain removed successfully.',
    )
  }

  const stopEditing = () => {
    setIsEditing(false)
    setNewDomain('')
    setInputError(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium">Domains</h3>
        <p className="text-sm text-muted-foreground">Domains associated with your organization. Used to detect your branding for the Trust Center.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading domains...</p>
      ) : isEditing ? (
        <div className="flex flex-col items-start gap-3 max-w-xl">
          <DomainListEditor
            domains={domains}
            newDomain={newDomain}
            onNewDomainChange={(value) => {
              setNewDomain(value)
              if (inputError) setInputError(null)
            }}
            onAdd={addDomain}
            onRemove={removeDomain}
            error={inputError}
            isPending={isPending}
            emptyText="No domains yet."
            inputLabel="Organization domain"
            addLabel="Add Domain"
            addOnEnter
          />
          <Button type="button" variant="secondary" onClick={stopEditing}>
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <DomainListEditor domains={domains} emptyText="No domains yet." />
          <Button type="button" variant="secondary" icon={<Pencil size={14} />} aria-label="Edit domains" onClick={() => setIsEditing(true)} disabled={!settingId} />
        </div>
      )}
    </div>
  )
}

export { OrganizationDomains }
