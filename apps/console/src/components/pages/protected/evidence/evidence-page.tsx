import React from 'react'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidence',
}
const EvidencePage: React.FC = () => {
  return <EvidenceCreateForm excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.RISK]} />
}

export default EvidencePage
