'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetTitle } from '@repo/ui/sheet'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { ArrowLeft, ArrowRightLeft, Loader2, X } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SecondaryRecordPicker } from './secondary-record-picker'
import { MergeFieldRow } from './merge-field-row'
import { MergeFinalPreview } from './merge-final-preview'
import { useMergeResolution } from './use-merge-resolution'
import { buildMergeFields } from './build-fields'
import type { MergeConfig, MergePreSaveExtrasResult } from './types'

type Props<TRecord, TUpdateInput> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: MergeConfig<TRecord, TUpdateInput>
  primaryId: string
  onMergeComplete?: () => void
}

export const MergeRecordsSheet = <TRecord extends object, TUpdateInput>({ open, onOpenChange, config, primaryId, onMergeComplete }: Props<TRecord, TUpdateInput>) => {
  const [secondaryId, setSecondaryId] = useState<string | null>(null)
  const [secondaryLabelCache, setSecondaryLabelCache] = useState<string>('')
  const [step, setStep] = useState<'select' | 'preview'>('select')
  const [isMerging, setIsMerging] = useState(false)

  const { data: primary, isLoading: isPrimaryLoading } = config.useFetchRecord(open ? primaryId : null)
  const { data: secondary, isLoading: isSecondaryLoading } = config.useFetchRecord(open ? secondaryId : null)

  const update = config.useUpdate()
  const del = config.useDelete()

  const fields = useMemo(() => (primary ? buildMergeFields(primary, config.fieldOverrides, config.excludeFields) : []), [primary, config.fieldOverrides, config.excludeFields])

  const { visibleFields, resolvedFields, resolvedRecord, setSource, setArrayStrategy, emailAliasFold } = useMergeResolution({ config, fields, primary, secondary })

  const emptyExtras = useMemo<MergePreSaveExtrasResult<TUpdateInput>>(() => ({ data: null, counts: [], isLoading: false }), [])
  const extras = config.usePreSaveInputExtras ? config.usePreSaveInputExtras({ primaryId, secondaryId: open ? secondaryId : null, primary }) : emptyExtras

  const queryClient = useQueryClient()
  const { successNotification, errorNotification, warningNotification } = useNotification()

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

  const canMerge = !!primary && !!secondary && secondaryId !== primaryId && !extras.isLoading

  const runMerge = async () => {
    if (!secondaryId || !canMerge) return
    setIsMerging(true)

    const baseInput = config.toUpdateInput(resolvedRecord)
    const input = { ...baseInput, ...(extras.data ?? {}) } as TUpdateInput

    const invalidate = () => {
      for (const key of config.invalidateKeys ?? []) {
        queryClient.invalidateQueries({ queryKey: key })
      }
    }

    const finishMerge = () => {
      setIsMerging(false)
      handleReset()
      onMergeComplete?.()
      onOpenChange(false)
    }

    if (config.deleteSecondaryFirst) {
      try {
        await del.mutateAsync(secondaryId)
      } catch (error) {
        setIsMerging(false)
        errorNotification({ title: 'Merge failed', description: parseErrorMessage(error) })
        return
      }

      try {
        await update.mutateAsync({ id: primaryId, input })
      } catch (error) {
        invalidate()
        warningNotification({
          title: 'Merge incomplete',
          description: `The secondary ${config.labelSingular} was deleted, but updating the primary failed: ${parseErrorMessage(error)}. Apply the changes manually.`,
        })
        finishMerge()
        return
      }

      invalidate()
      successNotification({ title: 'Merge complete', description: `The ${config.labelSingular} records were merged successfully.` })
      finishMerge()
      return
    }

    try {
      await update.mutateAsync({ id: primaryId, input })
    } catch (error) {
      setIsMerging(false)
      errorNotification({ title: 'Merge failed', description: parseErrorMessage(error) })
      return
    }

    let deleteFailed = false
    try {
      await del.mutateAsync(secondaryId)
    } catch (error) {
      deleteFailed = true
      warningNotification({
        title: 'Secondary not deleted',
        description: `The merge was applied to the primary record, but the secondary ${config.labelSingular} could not be deleted: ${parseErrorMessage(error)}. Please remove it manually.`,
      })
    }

    invalidate()

    if (!deleteFailed) {
      successNotification({ title: 'Merge complete', description: `The ${config.labelSingular} records were merged successfully.` })
    }

    finishMerge()
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

                {config.usePreSaveInputExtras && (
                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Linked records being transferred</h3>
                      {extras.isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
                    </div>
                    <div className="rounded-md border p-3 bg-muted/20">
                      {extras.isLoading ? (
                        <p className="text-xs text-muted-foreground">Loading linked records from secondary…</p>
                      ) : extras.counts.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No linked records on the secondary. Nothing else to transfer.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {extras.counts.map((c) => (
                            <Badge key={c.label} variant="outline" className="text-xs">
                              {c.count} {c.label.toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}
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
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-background border-t px-4 py-3 flex items-center justify-end gap-2">
            {step === 'select' ? (
              <>
                <Button type="button" variant="secondary" onClick={handleClose} disabled={isMerging}>
                  Cancel
                </Button>
                <Button type="button" disabled={!canMerge || isMerging} onClick={() => setStep('preview')}>
                  Preview record
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="secondary" onClick={() => setStep('select')} disabled={isMerging} icon={<ArrowLeft size={14} />} iconPosition="left">
                  Back
                </Button>
                <Button type="button" variant="destructive" disabled={!canMerge || isMerging} onClick={runMerge}>
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
