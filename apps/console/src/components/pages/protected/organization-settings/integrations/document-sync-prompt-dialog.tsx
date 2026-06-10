'use client'

import React, { useState } from 'react'
import { FileText, FolderSync, Info, Star } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Switch } from '@repo/ui/switch'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { DOCUMENT_FOLDER_FIELD, PRIMARY_DOCUMENT_FIELD, saveIntegrationConfiguration } from '@/lib/integrations/flow'
import { readIntegrationUserInput } from '@/lib/integrations/utils'
import { type IntegrationMetadata, type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'

type DocumentSyncPromptDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: IntegrationProvider
  integration: IntegrationNode
}

const DocumentSyncPromptDialog = ({ open, onOpenChange, provider, integration }: DocumentSyncPromptDialogProps) => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()

  const existingUserInput = readIntegrationUserInput(integration)
  const existingFolder = typeof existingUserInput[DOCUMENT_FOLDER_FIELD] === 'string' ? (existingUserInput[DOCUMENT_FOLDER_FIELD] as string) : ''

  const [makePrimary, setMakePrimary] = useState<boolean>(true)
  const [folder, setFolder] = useState<string>(existingFolder)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      const meta = integration.metadata as IntegrationMetadata | undefined

      await saveIntegrationConfiguration({
        definitionId: provider.id,
        installationId: integration.id,
        credentialRef: meta?.credentialRef || undefined,
        body: {},
        userInput: {
          ...existingUserInput,
          [PRIMARY_DOCUMENT_FIELD]: makePrimary,
          [DOCUMENT_FOLDER_FIELD]: folder.trim(),
        },
      })

      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      successNotification({
        title: 'Document sync updated',
        description: `${provider.displayName} sync settings were saved.`,
      })
      onOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Failed to update document sync',
        description: error instanceof Error ? error.message : 'Unexpected error while updating the integration.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-150 w-[92vw] gap-0 overflow-hidden p-0">
        <div className="flex flex-1 flex-col gap-6 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl">Set up {provider.displayName} document sync</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">Choose how Openlane should pull documents from {provider.displayName}.</DialogDescription>
          </DialogHeader>

          <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <Star className="size-5 text-brand" />
              </span>
              <div>
                <p className="text-sm font-medium">Make this my primary document integration</p>
                <p className="text-xs text-muted-foreground">Openlane will use this connection as the authoritative source for live document exports.</p>
              </div>
            </div>
            <Switch checked={makePrimary} onCheckedChange={setMakePrimary} disabled={isSubmitting} />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <FolderSync className="size-5 text-brand" />
              </span>
              <div>
                <p className="text-sm font-medium">Limit sync to a specific folder</p>
                <p className="text-xs text-muted-foreground">Only documents inside this folder are synced into Openlane. Leave blank to sync everything you’ve granted access to.</p>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="document-sync-folder" className="text-xs text-muted-foreground">
                Folder ID or URL
              </Label>
              <Input
                id="document-sync-folder"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="e.g. 1A2b3C... or https://drive.google.com/drive/folders/1A2b3C..."
                disabled={isSubmitting}
                icon={<FileText className="size-4" />}
                iconPosition="left"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Info className="mt-0.5 size-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-medium">Only one document integration can be primary.</p>
              <p className="text-xs text-muted-foreground">If another document integration is already primary, setting this one will replace it.</p>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Not now
            </Button>
            <Button type="button" icon={<FolderSync className="size-4" />} iconPosition="left" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save sync settings'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentSyncPromptDialog
