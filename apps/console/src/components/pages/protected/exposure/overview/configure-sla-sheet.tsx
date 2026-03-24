'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { useSlaDefinitionsWithFilter, useUpdateSlaDefinition } from '@/lib/graphql-hooks/sla-definition'
import { SlaDefinitionSecurityLevel } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { getSeverityStyle } from '@/utils/severity'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { ObjectTypes } from '@repo/codegen/src/type-names'

type Props = {
  isOpen: boolean
  onClose: () => void
  readOnly?: boolean
}

const ConfigureSlaSheet = ({ isOpen, onClose, readOnly = false }: Props) => {
  const SEVERITY_ORDER = [SlaDefinitionSecurityLevel.CRITICAL, SlaDefinitionSecurityLevel.HIGH, SlaDefinitionSecurityLevel.MEDIUM, SlaDefinitionSecurityLevel.LOW]

  const { slaDefinitionsNodes: rawSlaNodes, isLoading } = useSlaDefinitionsWithFilter({})

  const slaDefinitionsNodes = [...(rawSlaNodes ?? [])].sort((a, b) => {
    const aIdx = SEVERITY_ORDER.indexOf((a.securityLevel as SlaDefinitionSecurityLevel) ?? SlaDefinitionSecurityLevel.NONE)
    const bIdx = SEVERITY_ORDER.indexOf((b.securityLevel as SlaDefinitionSecurityLevel) ?? SlaDefinitionSecurityLevel.NONE)
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })
  const { mutateAsync: updateSlaDefinition, isPending } = useUpdateSlaDefinition()
  const { successNotification, errorNotification } = useNotification()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const form = useForm()

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null)
      setEditValue('')
    }
  }, [isOpen])

  const handleEdit = (id: string, currentDays: number | null | undefined) => {
    setEditingId(id)
    setEditValue(String(currentDays ?? ''))
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (id: string) => {
    const days = parseInt(editValue, 10)
    if (isNaN(days) || days < 0) {
      errorNotification({ title: 'Invalid value', description: 'SLA days must be a non-negative number' })
      return
    }
    try {
      await updateSlaDefinition({ updateSlaDefinitionId: id, input: { slaDays: days } })
      successNotification({ title: 'SLA updated', description: 'SLA definition updated successfully' })
      setEditingId(null)
      setEditValue('')
    } catch {
      errorNotification({ title: 'Failed to update', description: 'Could not update SLA definition' })
    }
  }

  const overrideHeader = <SheetTitle>{readOnly ? 'View SLA Definitions' : 'Configure SLA Definitions'}</SheetTitle>

  const overrideContent = (
    <div className="mt-6 space-y-1">
      <p className="text-sm text-muted-foreground mb-4">Set the number of days allowed for each severity level before an open vulnerability or finding is considered past due.</p>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={52} />
          ))}
        </div>
      ) : slaDefinitionsNodes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No SLA definitions configured.</p>
      ) : (
        <div className="divide-y divide-border rounded-md border">
          {slaDefinitionsNodes.map((def) => {
            const isEditing = editingId === def.id
            const severityName = def.securityLevel ?? 'Unknown'
            return (
              <div key={def.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize w-20 text-center" style={getSeverityStyle(severityName)}>
                    {severityName.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-25 h-8 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(def.id)
                          if (e.key === 'Escape') handleCancel()
                        }}
                        autoFocus
                      />
                      <span className="text-sm text-muted-foreground">days</span>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleSave(def.id)} disabled={isPending}>
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="text-success" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleCancel} disabled={isPending}>
                        <X size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium tabular-nums">{def.slaDays != null ? `${def.slaDays} days` : <span className="text-muted-foreground">—</span>}</span>
                      {!readOnly && (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEdit(def.id, def.slaDays)}>
                          <Pencil size={14} className="text-muted-foreground" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <GenericDetailsSheet
      objectType={ObjectTypes.CONTACT}
      form={form}
      entityId={isOpen ? 'configure-sla' : null}
      isFetching={false}
      onClose={onClose}
      overrideHeader={overrideHeader}
      overrideContent={overrideContent}
      minWidth={480}
      initialWidth={480}
    />
  )
}

export default ConfigureSlaSheet
