'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Info, ShieldCheck, Star, UserCheck, Users } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { PRIMARY_DIRECTORY_FIELD, saveIntegrationConfiguration } from '@/lib/integrations/flow'
import { type IntegrationMetadata, type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'

type IntegrationClientConfig = {
  clientConfig?: Record<string, unknown>
}

type PrimaryDirectoryPromptDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: IntegrationProvider
  integration: IntegrationNode
}

const benefits = [
  {
    icon: Users,
    title: 'Sync employee status',
    description: 'Keep personnel active, suspended, or departed in sync.',
  },
  {
    icon: UserCheck,
    title: 'Resolve personnel automatically',
    description: 'Reduce “Unknown” personnel statuses.',
  },
  {
    icon: ShieldCheck,
    title: 'One source of truth',
    description: 'Ensure Openlane uses the right IDP for accurate data.',
  },
]

const PrimaryDirectoryPromptDialog = ({ open, onOpenChange, provider, integration }: PrimaryDirectoryPromptDialogProps) => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const meta = integration.metadata as IntegrationMetadata | undefined
      const existingConfig = integration.config as IntegrationClientConfig | null
      const existingUserInput = existingConfig?.clientConfig ?? {}

      await saveIntegrationConfiguration({
        definitionId: provider.id,
        installationId: integration.id,
        credentialRef: meta?.credentialRef || undefined,
        body: {},
        userInput: { ...existingUserInput, [PRIMARY_DIRECTORY_FIELD]: true },
      })

      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification({
        title: 'Primary directory set',
        description: `${provider.displayName} is now your organization's primary directory.`,
      })
      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Failed to set primary directory',
        description: error instanceof Error ? error.message : 'Unexpected error while updating the integration.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-235 w-[92vw] gap-0 overflow-hidden p-0">
        <div className="flex flex-col md:flex-row">
          <div className="hidden md:flex md:w-[42%] items-center justify-center bg-muted/40 p-8">
            <Image src="/images/primary-directory-prompt.png" alt="" width={420} height={300} className="h-auto w-full max-w-90" />
          </div>

          <div className="flex flex-1 flex-col gap-6 p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl">Make this your primary directory?</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">Openlane uses a primary directory as the source of truth for personnel identity and status.</DialogDescription>
            </DialogHeader>

            <ul className="flex flex-col gap-4">
              {benefits.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                    <Icon className="size-5 text-brand" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Info className="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm font-medium">Only one directory can be primary.</p>
                <p className="text-xs text-muted-foreground">If another directory is already primary, setting this one will replace it.</p>
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Not now
              </Button>
              <Button type="button" icon={<Star className="size-4" />} iconPosition="left" onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Set as primary directory'}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PrimaryDirectoryPromptDialog
