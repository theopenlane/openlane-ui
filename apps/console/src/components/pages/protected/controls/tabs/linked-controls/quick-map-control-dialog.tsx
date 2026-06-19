'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useGetAllControls } from '@/lib/graphql-hooks/control'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { MappedControlMappingSource, MappedControlMappingType, type ControlWhereInput } from '@repo/codegen/src/schema'
import { useDebounce } from '@uidotdev/usehooks'
import { Search, Loader2, Link2 } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { toast } from 'sonner'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TruncatedCell } from '@repo/ui/data-table'
import StandardChip from '@/components/pages/protected/standards/shared/standard-chip'

type QuickMapVariant = 'org' | 'framework'

type Props = {
  controlId?: string
  subcontrolId?: string
  refCode: string
  variant?: QuickMapVariant
}

type ControlOption = {
  id: string
  refCode: string
  description?: string | null
  status?: string | null
  referenceFramework?: string | null
}

const SUGGESTION_PAGINATION = { page: 1, pageSize: 50, query: { first: 50 } }

const VARIANT_COPY: Record<QuickMapVariant, { buttonLabel: string; dialogTitle: string; searchPlaceholder: string; emptySearch: string; emptySuggested: string }> = {
  org: {
    buttonLabel: 'Link org control',
    dialogTitle: 'Map organization control',
    searchPlaceholder: 'Search organization controls…',
    emptySearch: 'No controls match your search.',
    emptySuggested: 'No suggested controls found.',
  },
  framework: {
    buttonLabel: 'Link framework control',
    dialogTitle: 'Map framework control',
    searchPlaceholder: 'Search framework controls…',
    emptySearch: 'No framework controls match your search.',
    emptySuggested: 'No suggested framework controls found.',
  },
}

const getScopeWhere = (variant: QuickMapVariant): ControlWhereInput =>
  variant === 'framework' ? { referenceFrameworkNotNil: true, referenceFrameworkNEQ: 'CUSTOM', systemOwned: false } : { referenceFrameworkIsNil: true, systemOwned: false }

const getSuggestionRefCode = (refCode: string): string => {
  const lastSeparator = Math.max(refCode.lastIndexOf('.'), refCode.lastIndexOf('-'))
  return lastSeparator > 0 ? refCode.slice(0, lastSeparator) : refCode
}

export const QuickMapControlDialog: React.FC<Props> = ({ controlId, subcontrolId, refCode, variant = 'org' }) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const { mutateAsync: createMappedControl, isPending } = useCreateMappedControl()
  const { convertToReadOnly } = usePlateEditor()

  const copy = VARIANT_COPY[variant]

  const suggestedWhere = useMemo<ControlWhereInput>(
    () => ({
      ...getScopeWhere(variant),
      refCodeContainsFold: getSuggestionRefCode(refCode),
      ...(controlId ? { idNotIn: [controlId] } : {}),
    }),
    [variant, refCode, controlId],
  )

  const searchWhere = useMemo<ControlWhereInput>(() => {
    const trimmed = debouncedSearch.trim()
    return {
      ...getScopeWhere(variant),
      ...(controlId ? { idNotIn: [controlId] } : {}),
      ...(trimmed ? { or: [{ refCodeContainsFold: trimmed }, { descriptionContainsFold: trimmed }] } : {}),
    }
  }, [variant, debouncedSearch, controlId])

  const { controls: suggested, isLoading: isSuggestedLoading } = useGetAllControls({
    where: suggestedWhere,
    pagination: SUGGESTION_PAGINATION,
    enabled: open,
  })

  const { controls: searchResults, isLoading: isSearchLoading } = useGetAllControls({
    where: searchWhere,
    pagination: SUGGESTION_PAGINATION,
    enabled: open && debouncedSearch.trim().length > 0,
  })

  const isSearching = debouncedSearch.trim().length > 0
  const displayControls: ControlOption[] = useMemo(() => {
    const source = isSearching ? searchResults : suggested
    return source
      .filter((c): c is typeof c & { id: string; refCode: string } => !!c?.id && !!c?.refCode)
      .map((c) => ({ id: c.id, refCode: c.refCode, description: c.description, status: c.status, referenceFramework: c.referenceFramework }))
  }, [isSearching, searchResults, suggested])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) return
    const fromInput = subcontrolId ? { fromSubcontrolIDs: [subcontrolId] } : controlId ? { fromControlIDs: [controlId] } : null
    if (!fromInput) return

    const ids = Array.from(selected)
    const results = await Promise.allSettled(
      ids.map((toControlId) =>
        createMappedControl({
          input: {
            ...fromInput,
            toControlIDs: [toControlId],
            confidence: 100,
            source: MappedControlMappingSource.MANUAL,
            mappingType: MappedControlMappingType.PARTIAL,
          },
        }),
      ),
    )

    const failedIds = ids.filter((_, index) => results[index].status === 'rejected')
    const succeededCount = ids.length - failedIds.length

    if (succeededCount > 0) {
      toast.success(`Mapped ${succeededCount} control${succeededCount !== 1 ? 's' : ''}`)
    }

    if (failedIds.length > 0) {
      toast.error(`Failed to map ${failedIds.length} control${failedIds.length !== 1 ? 's' : ''}`)
      setSelected(new Set(failedIds))
      return
    }

    setOpen(false)
    setSelected(new Set())
    setSearch('')
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSelected(new Set())
      setSearch('')
    }
  }

  const isLoading = isSearching ? isSearchLoading : isSuggestedLoading

  const allSelected = displayControls.length > 0 && displayControls.every((c) => selected.has(c.id))
  const someSelected = displayControls.some((c) => selected.has(c.id)) && !allSelected

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        displayControls.forEach((c) => next.delete(c.id))
      } else {
        displayControls.forEach((c) => next.add(c.id))
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="h-8 px-2" icon={<Link2 size={16} />} iconPosition="left">
          {copy.buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.dialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={copy.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="min-h-0 max-h-72 overflow-y-auto rounded-md border divide-y">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : displayControls.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{isSearching ? copy.emptySearch : copy.emptySuggested}</p>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3 py-2 bg-muted/80 border-b">
                <Checkbox checked={someSelected ? 'indeterminate' : allSelected} onCheckedChange={toggleAll} />
                <span className="text-xs font-medium text-muted-foreground">{!isSearching ? `Suggested — matches ${refCode}` : 'Select all'}</span>
              </div>
              {displayControls.map((ctrl) => (
                <label key={ctrl.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer">
                  <Checkbox checked={selected.has(ctrl.id)} onCheckedChange={() => toggle(ctrl.id)} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-tight">{ctrl.refCode}</p>
                      <StandardChip referenceFramework={ctrl.referenceFramework ?? ''} />
                    </div>
                    {ctrl.description && (
                      <TruncatedCell portal className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-justify whitespace-normal">
                        {convertToReadOnly(ctrl.description, 0)}
                      </TruncatedCell>
                    )}
                  </div>
                  {ctrl.status && <span className="shrink-0 text-xs text-muted-foreground">{getEnumLabel(ctrl.status)}</span>}
                </label>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selected.size === 0 || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Map {selected.size > 0 ? `${selected.size} ` : ''}control{selected.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
