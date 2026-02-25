'use client'
import React from 'react'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config.ts'
import { canCreate } from '@/lib/authz/utils'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { Loading } from '@/components/shared/loading/loading'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const EvidencePage: React.FC = () => {
  const { data: permission, isLoading: permissionsLoading } = useOrganizationRoles()

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
