'use client'

import React from 'react'
import { EntityDocumentsSection } from '@/components/pages/protected/vendors/create/form/fields/documents-section'

interface DocumentsTabProps {
  vendorId: string
  canEdit: boolean
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ vendorId, canEdit: canEditVendor }) => {
  return <EntityDocumentsSection entityId={vendorId} isEditAllowed={canEditVendor} isCreate={false} />
}

export default DocumentsTab
