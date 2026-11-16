'use client'

import React from 'react'
import RemediationSheet from './sheet/remediation-sheet'
import { type TRemediationContextRef } from './sheet/remediation-context'

type Props = {
  isOpen: boolean
  onClose: () => void
  context?: TRemediationContextRef
  initialInstructions?: string
  onSuccess?: (remediationId: string) => void
}

const CreateRemediationSheet: React.FC<Props> = ({ isOpen, onClose, context, initialInstructions, onSuccess }) => (
  <RemediationSheet open={isOpen} initialContext={context} initialInstructions={initialInstructions} onClose={onClose} onCreated={onSuccess} />
)

export default CreateRemediationSheet
