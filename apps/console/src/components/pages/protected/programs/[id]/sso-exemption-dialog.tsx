'use client'

import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useNotification } from '@/hooks/useNotification'
import { useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { useQueryClient } from '@tanstack/react-query'
import type React from 'react'

interface SSOExemptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  emails: string[]
  domains: string[]
  organizationId?: string
  organizationSettingId?: string
  ssoExemptDomains: string[]
}

export const SSOExemptionDialog: React.FC<SSOExemptionDialogProps> = ({ open, onOpenChange, emails, domains, organizationId, organizationSettingId, ssoExemptDomains }) => {
  const { mutateAsync: updateOrgSetting, isPending } = useUpdateOrganizationSetting()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const domainLabel = domains.join(', ')
  const emailLabel = emails.join(', ')

  const handleAddSSOExemption = async () => {
    if (!organizationSettingId || domains.length === 0) return

    try {
      await updateOrgSetting({
        updateOrganizationSettingId: organizationSettingId,
        input: {
          ssoExemptDomains: Array.from(new Set([...ssoExemptDomains, ...domains])),
        },
      })
      queryClient.invalidateQueries({ queryKey: ['organizationSetting', organizationId] })
      successNotification({
        title: domains.length > 1 ? 'SSO exemptions added' : 'SSO exemption added',
        description: `${domainLabel} ${domains.length > 1 ? 'were' : 'was'} added to SSO exempt domains.`,
      })
      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error adding SSO exemption',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[497px]">
        <DialogHeader>
          <DialogTitle>Add SSO exemption?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong>{emailLabel}</strong> {emails.length > 1 ? 'were' : 'was'} invited as {emails.length > 1 ? 'Auditors' : 'an Auditor'}. Because SSO is enforced, add <strong>{domainLabel}</strong>{' '}
            to SSO exemptions so they can accept the invite without using your identity provider.
          </p>
        </div>
        <DialogFooter className="mt-6 flex gap-2">
          <Button onClick={handleAddSSOExemption} disabled={isPending}>
            Add {domains.length > 1 ? 'domains' : 'domain'} to SSO exemptions
          </Button>
          <CancelButton title="Skip" disabled={isPending} onClick={() => onOpenChange(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
