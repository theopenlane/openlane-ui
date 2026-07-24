'use client'

import type React from 'react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useUpdateOrganizationSetting } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface SSOExemptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email?: string | null
  domain?: string | null
  organizationId?: string
  organizationSettingId?: string
  ssoExemptDomains: string[]
}

export const SSOExemptionDialog: React.FC<SSOExemptionDialogProps> = ({ open, onOpenChange, email, domain, organizationId, organizationSettingId, ssoExemptDomains }) => {
  const { mutateAsync: updateOrgSetting, isPending } = useUpdateOrganizationSetting()
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const handleAddSSOExemption = async () => {
    if (!organizationSettingId || !domain) return

    try {
      await updateOrgSetting({
        updateOrganizationSettingId: organizationSettingId,
        input: {
          ssoExemptDomains: [...ssoExemptDomains, domain],
        },
      })
      queryClient.invalidateQueries({ queryKey: ['organizationSetting', organizationId] })
      successNotification({
        title: 'SSO exemption added',
        description: `${domain} was added to SSO exempt domains.`,
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
            <strong>{email}</strong> was invited as an Auditor. Because SSO is enforced, add <strong>{domain}</strong> to SSO exemptions so they can accept the invite without using your identity
            provider.
          </p>
        </div>
        <DialogFooter className="mt-6 flex gap-2">
          <Button onClick={handleAddSSOExemption} disabled={isPending}>
            Add domain to SSO exemptions
          </Button>
          <CancelButton title="Skip" onClick={() => onOpenChange(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
