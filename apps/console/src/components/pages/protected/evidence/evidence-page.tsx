'use client'
import React from 'react'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config.ts'
import { canCreate } from '@/lib/authz/utils'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { useOrganizationRole } from '@/lib/authz/access-api'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { Loading } from '@/components/shared/loading/loading'
import { useSession } from 'next-auth/react'

const EvidencePage: React.FC = () => {
  const { data: sessionData } = useSession()

  const { data: permission, isLoading: permissionsLoading } = useOrganizationRole(sessionData)

  const createAllowed = canCreate(permission?.roles, AccessEnum.CanCreateEvidence)

  if (!permissionsLoading && createAllowed === false) {
    return <ProtectedArea />
  }

  if (permissionsLoading) {
    return <Loading />
  }

  return <EvidenceCreateForm excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.RISK]} />
}

export default EvidencePage
