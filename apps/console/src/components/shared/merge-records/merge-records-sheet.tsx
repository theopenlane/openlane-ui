'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Sheet, SheetContent, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ArrowLeft, ArrowRightLeft, Loader2, X } from 'lucide-react'
import { SecondaryRecordPicker } from './secondary-record-picker'
import { MergeFieldRow } from './merge-field-row'
import { MergeFinalPreview } from './merge-final-preview'
import { MergeTransferSummary } from './merge-transfer-summary'
import { useMergeResolution } from './use-merge-resolution'
import { useMergeRunner } from './use-merge-runner'
import { buildMergeFields } from './build-fields'
import { MERGEABLE_FIELDS_BY_TYPE, type MergeableTypeName } from '@repo/codegen/src/merge-fields.generated'
import { useMergeEdgeTransfer } from './use-merge-edge-transfer'
import type { MergeConfig } from './types'

type Props<TRecord, TUpdateInput, TEntity extends MergeableTypeName> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: MergeConfig<TRecord, TUpdateInput, TEntity>
  primaryId: string
  initialSecondaryId?: string
  initialSecondaryLabel?: string
  onMergeComplete?: () => void
}

export const MergeRecordsSheet = <TRecord extends object, TUpdateInput, TEntity extends MergeableTypeName>({
  open,
  onOpenChange,
  config,
  primaryId,
  initialSecondaryId,
  initialSecondaryLabel,
  onMergeComplete,
}: Props<TRecord, TUpdateInput, TEntity>) => {
  const [secondaryId, setSecondaryId] = useState<string | null>(initialSecondaryId ?? null)
  const [secondaryLabelCache, setSecondaryLabelCache] = useState<string>(initialSecondaryLabel ?? '')
  const [step, setStep] = useState<'select' | 'preview'>('select')

  const { data: primary, isLoading: isPrimaryLoading } = config.useFetchRecord(open ? primaryId : null)
  const { data: secondary, isLoading: isSecondaryLoading } = config.useFetchRecord(open ? secondaryId : null)

  const update = config.useUpdate()
  const del = config.useDelete()

  const fields = useMemo(
    () => (primary ? buildMergeFields(primary, config.fieldOverrides, config.excludeFields, MERGEABLE_FIELDS_BY_TYPE[config.entityType], config.schemaExcludeFields) : []),
    [primary, config.fieldOverrides, config.excludeFields, config.entityType, config.schemaExcludeFields],
  )

  const { visibleFields, resolvedFields, resolvedRecord, setSource, setArrayStrategy, emailAliasFold } = useMergeResolution({ config, fields, primary, secondary })

  const edgeTransfer = useMergeEdgeTransfer({ entityType: config.entityType, primaryId, secondaryId: open ? secondaryId : null, excludeEdges: config.excludeEdges })
  const customExtras = primary && secondary && config.preSaveInputExtras ? config.preSaveInputExtras({ primary, secondary }) : null
  const transferCounts = [...edgeTransfer.counts, ...(customExtras?.counts ?? [])]

  const primaryLabel = useMemo(() => {
    if (!primary) return primaryId
    if (config.getDisplayName) return config.getDisplayName(primary)
    return (primary as { fullName?: string; name?: string }).fullName ?? (primary as { name?: string }).name ?? primaryId
  }, [primary, primaryId, config])

  const secondaryLabel = useMemo(() => {
    if (!secondary) return secondaryLabelCache || (secondaryId ?? '')
    if (config.getDisplayName) return config.getDisplayName(secondary)
    return (secondary as { fullName?: string; name?: string }).fullName ?? (secondary as { name?: string }).name ?? secondaryId ?? ''
  }, [secondary, secondaryId, secondaryLabelCache, config])

  const handleReset = () => {
    setSecondaryId(null)
    setSecondaryLabelCache('')
    setStep('select')
  }

  const { isMerging, runMerge } = useMergeRunner({
    config,
    primaryId,
    update,
    del,
    readLatestAddInput: edgeTransfer.readLatestAddInput,
    onFinished: () => {
      handleReset()
      onMergeComplete?.()
      onOpenChange(false)
    },
  })

  const handleClose = () => {
    if (isMerging) return
    handleReset()
    onOpenChange(false)
  }

  useEffect(() => {
    if (!open) setStep('select')
  }, [open])

  useEffect(() => {
    if (!secondaryId) setStep('select')
  }, [secondaryId])

  const canSelectSecondary = !!primary && !!secondary && secondaryId !== primaryId
  const canMerge = canSelectSecondary && !edgeTransfer.isLoading && !edgeTransfer.error

  const confirmMerge = () => {
    if (!secondaryId || !canMerge) return
    const fieldInput = { ...config.toUpdateInput(resolvedRecord), ...(customExtras?.data ?? {}) } as TUpdateInput
    runMerge(secondaryId, fieldInput)
  }

  const loadingBothSides = isPrimaryLoading || (secondaryId !== null && isSecondaryLoading)

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
        <SheetContent
          side="right"
          initialWidth="55vw"
          minWidth="40vw"
          header={
            <div className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} />
                <SheetTitle className="text-lg">Merge {config.labelSingular}</SheetTitle>
              </div>
              <Button type="button" variant="transparent" onClick={handleClose} aria-label="Close" className="h-8 px-2">
                <X size={16} />
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-6 p-1 pb-24">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Records</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="green">Primary</Badge>
                    <span className="text-xs text-muted-foreground">Kept; receives merged values</span>
                  </div>
                  <div className="text-sm truncate">{primaryLabel}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive">Secondary</Badge>
                    <span className="text-xs text-muted-foreground">Deleted after merge</span>
                  </div>
                  <SecondaryRecordPicker
                    placeholder={`Select a ${config.labelSingular} to merge…`}
                    excludeId={primaryId}
                    selectedId={secondaryId}
                    selectedLabel={secondaryLabel}
                    onSelect={(id, label) => {
                      setSecondaryId(id)
                      setSecondaryLabelCache(label)
                    }}
                    useSearchRecords={config.useSearchRecords}
                  />
                </div>
              </div>
            </section>

            {loadingBothSides && secondaryId && (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            )}

            {!loadingBothSides && secondaryId && primary && secondary && step === 'select' && (
              <>
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Differences</h3>
                    <span className="text-xs text-muted-foreground">
                      {visibleFields.length} field{visibleFields.length === 1 ? '' : 's'} to reconcile
                    </span>
                  </div>
                  {visibleFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No differing fields. Merging will simply delete the secondary record.</p>
                  ) : (
                    <div className="space-y-3">
                      {visibleFields.map((rf) => {
                        const isEmailRow = emailAliasFold.available && rf.field.key === emailAliasFold.emailKey
                        return (
                          <MergeFieldRow
                            key={rf.field.key}
                            resolved={rf}
                            onPickSource={(source) => setSource(rf.field.key, source)}
                            onToggleArrayStrategy={(strategy) => setArrayStrategy(rf.field.key, strategy)}
                            aliasFoldToggle={
                              isEmailRow && emailAliasFold.label
                                ? {
                                    label: emailAliasFold.label,
                                    enabled: emailAliasFold.enabled,
                                    onToggle: emailAliasFold.setEnabled,
                                  }
                                : undefined
                            }
                          />
                        )
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {!loadingBothSides && secondaryId && primary && secondary && step === 'preview' && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Final record</h3>
                <p className="text-xs text-muted-foreground">
                  Review the merged record before confirming. The primary record will be updated and the secondary <b>{secondaryLabel}</b> will be permanently deleted.
                </p>
                <div className="rounded-md border p-4 bg-muted/20">
                  <MergeFinalPreview resolvedFields={resolvedFields} />
                </div>
              </section>
            )}

            {!loadingBothSides && secondaryId && primary && secondary && (
              <MergeTransferSummary counts={transferCounts} isLoading={edgeTransfer.isLoading} error={edgeTransfer.error} hasAclEdges={edgeTransfer.hasAclEdges} />
            )}
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-background border-t px-4 py-3 flex items-center justify-end gap-2">
            {step === 'select' ? (
              <>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isMerging}>
                  Cancel
                </Button>
                <Button type="button" disabled={!canSelectSecondary || isMerging} onClick={() => setStep('preview')}>
                  Preview record
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={() => setStep('select')} disabled={isMerging} icon={<ArrowLeft size={14} />} iconPosition="left">
                  Back
                </Button>
                <Button type="button" variant="destructive" disabled={!canMerge || isMerging} onClick={confirmMerge}>
                  {isMerging && <Loader2 size={14} className="mr-2 animate-spin" />}
                  Confirm merge
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
