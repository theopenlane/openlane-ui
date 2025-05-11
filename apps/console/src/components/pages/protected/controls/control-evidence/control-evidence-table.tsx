'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import EvidenceCreateFormDialog from '@/components/pages/protected/evidence/evidence-create-form-dialog'
import { EvidenceEdge } from '@repo/codegen/src/schema'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { useParams, usePathname } from 'next/navigation'
import { formatDateSince } from '@/utils/date'
import { useControlEvidenceStore } from '@/components/pages/protected/controls/hooks/useControlEvidenceStore.ts'
import { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'

type Props = {
  evidences?: (EvidenceEdge | null)[]
  control: TFormEvidenceData
  canEdit?: boolean
}

const ControlEvidenceTable = ({ evidences, control, canEdit }: Props) => {
  const pathname = usePathname()
  const { subcontrolId } = useParams()
  const { setSelectedControlEvidence } = useControlEvidenceStore()
  const isSubcontrol = !!subcontrolId
  const title = isSubcontrol ? 'Subcontrol Evidence' : 'Control Evidence12'

  const evidenceSheetHandler = (controlEvidenceID: string) => {
    setSelectedControlEvidence(controlEvidenceID)
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">{title}</h2>
        {canEdit && (
          <EvidenceCreateFormDialog
            formData={control}
            excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.RISK, ObjectTypeObjects.PROCEDURE, ObjectTypeObjects.GROUP, ObjectTypeObjects.INTERNAL_POLICY]}
          />
        )}
      </div>

      <div className="rounded-md border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4 py-2">ID</TableHead>
              <TableHead className="px-4 py-2">Name</TableHead>
              <TableHead className="px-4 py-2">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidences && evidences.length > 0 ? (
              evidences.map((edge, i) => {
                const node = edge?.node
                if (!node) return null

                return (
                  <TableRow key={i}>
                    <TableCell className="px-4 py-2 text-primary">
                      <p className="text-blue-500 cursor-pointer" onClick={() => evidenceSheetHandler(node?.id)}>
                        {node.displayID}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-2">{node.name}</TableCell>
                    <TableCell className="px-4 py-2">{formatDateSince(node.creationDate)}</TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-4 text-center text-muted-foreground">
                  No evidence linked to this {isSubcontrol ? 'subcontrol' : 'control'} yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ControlEvidenceTable
