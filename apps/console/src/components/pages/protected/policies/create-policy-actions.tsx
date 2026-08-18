'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DropdownMenuItem } from '@repo/ui/dropdown-menu'
import { FileTextIcon, PenLine, Sparkles } from 'lucide-react'
import { useCreateUploadInternalPolicy, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { wordTokens } from '@/utils/strings'

export type PolicyTemplate = { name: string; downloadUrl: string; size?: number }

// every word of the suggested name has to appear in the template name, so
// "Asset Management" finds asset_management_policy.md
export const findPolicyTemplate = (templates: PolicyTemplate[] | undefined, policyName: string) =>
  (templates ?? []).find((template) => wordTokens(policyName).every((token) => template.name.toLowerCase().includes(token)))

// download the Policy Hub template and create the policy from it, mapping it to
// the control it was suggested for when there is one
export function useCreatePolicyFromTemplate(mapControlId?: string) {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadPolicy } = useCreateUploadInternalPolicy()
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null)

  const createFromTemplate = async (template: PolicyTemplate) => {
    setCreatingTemplate(template.name)
    try {
      const response = await fetch(template.downloadUrl)
      if (!response.ok) throw new Error(`Could not download the ${template.name} template (${response.status})`)

      const blob = await response.blob()
      const file = new File([blob], template.name, { type: blob.type || 'text/markdown' })
      const result = await createUploadPolicy({ internalPolicyFile: file })
      const policyId = result.createUploadInternalPolicy.internalPolicy.id

      if (mapControlId) await updatePolicy({ updateInternalPolicyId: policyId, input: { addControlIDs: [mapControlId] } })
      successNotification({ title: mapControlId ? 'Policy created and mapped' : 'Policy Created', description: `Created from the ${template.name} template` })
      router.push(`/policies/${policyId}/view`)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      setCreatingTemplate(null)
    }
  }

  return { createFromTemplate, creatingTemplate }
}

type CreatePolicyMenuItemsProps = {
  policyName: string
  template?: PolicyTemplate
  mapControlId?: string
  onCreateFromTemplate: (template: PolicyTemplate) => void
}

// the ways to start a policy from a suggestion, shared by every surface suggesting one
export function CreatePolicyMenuItems({ policyName, template, mapControlId, onCreateFromTemplate }: CreatePolicyMenuItemsProps) {
  const router = useRouter()
  const createHref = (generate: boolean) => `/policies/create?name=${encodeURIComponent(policyName)}${generate ? '&generate=true' : ''}${mapControlId ? `&mapControlId=${mapControlId}` : ''}`

  return (
    <>
      <DropdownMenuItem className="flex items-center gap-2" onSelect={() => router.push(createHref(true))}>
        <Sparkles size={14} />
        Create with AI
      </DropdownMenuItem>
      {template && (
        <DropdownMenuItem className="flex items-center gap-2" onSelect={() => onCreateFromTemplate(template)}>
          <FileTextIcon size={14} />
          From Policy Hub
        </DropdownMenuItem>
      )}
      <DropdownMenuItem className="flex items-center gap-2" onSelect={() => router.push(createHref(false))}>
        <PenLine size={14} />
        Create from scratch
      </DropdownMenuItem>
    </>
  )
}
