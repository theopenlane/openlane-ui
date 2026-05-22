'use client'

import React, { useState } from 'react'
import { Repeat, Upload } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { type InternalPolicyByIdFragment, InternalPolicyDocumentManagementMode } from '@repo/codegen/src/schema'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import ReplaceDocumentDialog from './replace-document-dialog'

type Props = {
  policy: InternalPolicyByIdFragment
  editAllowed: boolean
}

const ExternalReferenceView: React.FC<Props> = ({ policy, editAllowed }) => {
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const { mutateAsync: updatePolicy } = useUpdateInternalPolicy()
  const { successNotification, errorNotification } = useNotification()

  const file = policy.file
  if (!file) return null

  const handleSwitchToManaged = async () => {
    setIsSwitching(true)
    try {
      await updatePolicy({
        updateInternalPolicyId: policy.id,
        input: { managementMode: InternalPolicyDocumentManagementMode.OPENLANE_MANAGED },
      })
      successNotification({ title: 'Policy switched to Openlane management' })
      setSwitchOpen(false)
    } catch (error) {
      errorNotification({
        title: 'Switch failed',
        description: parseErrorMessage(error),
      })
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {editAllowed && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{file.providedFileName}</p>
            <p className="text-xs text-muted-foreground">Word document managed outside Openlane.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" icon={<Upload size={14} />} iconPosition="left" onClick={() => setReplaceOpen(true)} disabled={isSwitching}>
              Replace document
            </Button>
            <Button type="button" variant="outline" icon={<Repeat size={14} />} iconPosition="left" onClick={() => setSwitchOpen(true)} disabled={isSwitching}>
              Switch to Openlane managed
            </Button>
          </div>
        </div>
      )}
      <ReplaceDocumentDialog policy={policy} open={replaceOpen} onOpenChange={setReplaceOpen} />
      <ConfirmationDialog
        open={switchOpen}
        onOpenChange={(open) => {
          if (!open && !isSwitching) setSwitchOpen(false)
        }}
        onConfirm={handleSwitchToManaged}
        title="Change management mode"
        confirmationText="Switch to Openlane managed"
        confirmationTextVariant="primary"
        loading={isSwitching}
        description={<>The Policy view will switch back to the Openlane editor. The uploaded Word file remains available for download.</>}
      />
    </div>
  )
}

export default ExternalReferenceView
