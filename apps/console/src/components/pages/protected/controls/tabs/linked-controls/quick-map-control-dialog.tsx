'use client'

import React, { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { useGetAllControls } from '@/lib/graphql-hooks/control'
import { useCreateMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { MappedControlMappingSource, MappedControlMappingType } from '@repo/codegen/src/schema'
import { useDebounce } from '@uidotdev/usehooks'
import { Search, Loader2, Link2 } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { toast } from 'sonner'

type Props = {
  controlId?: string
  subcontrolId?: string
  refCode: string
}

type ControlOption = {
  id: string
  refCode: string
  description?: string | null
  status?: string | null
}

const SUGGESTION_PAGINATION = { page: 1, pageSize: 50, query: { first: 50 } }

export const QuickMapControlDialog: React.FC<Props> = ({ controlId, subcontrolId, refCode }) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const { mutateAsync: createMappedControl, isPending } = useCreateMappedControl()

  const suggestedWhere = useMemo(
    () => ({
      referenceFrameworkIsNil: true,
      refCodeContainsFold: refCode.split('-')[0],
      ...(controlId ? { idNotIn: [controlId] } : {}),
    }),
    [refCode, controlId],
  )

  const searchWhere = useMemo(() => {
    const trimmed = debouncedSearch.trim()
    return {
      referenceFrameworkIsNil: true,
      ...(controlId ? { idNotIn: [controlId] } : {}),
      ...(trimmed ? { or: [{ refCodeContainsFold: trimmed }, { descriptionContainsFold: trimmed }] } : {}),
    }
  }, [debouncedSearch, controlId])

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
    return source.filter((c): c is typeof c & { id: string; refCode: string } => !!c?.id && !!c?.refCode).map((c) => ({ id: c.id, refCode: c.refCode, description: c.description, status: c.status }))
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
    try {
      await Promise.all(
        Array.from(selected).map((toControlId) =>
          createMappedControl({
            input: {
              ...(subcontrolId ? { fromSubcontrolIDs: [subcontrolId] } : { fromControlIDs: [controlId as string] }),
              toControlIDs: [toControlId],
              confidence: 100,
              source: MappedControlMappingSource.MANUAL,
              mappingType: MappedControlMappingType.PARTIAL,
            },
          }),
        ),
      )
      toast.success(`Mapped ${selected.size} control${selected.size !== 1 ? 's' : ''}`)
      setOpen(false)
      setSelected(new Set())
      setSearch('')
    } catch {
      toast.error('Failed to create mapping')
    }
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
          Link org control
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Map organization control</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search organization controls…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="min-h-0 max-h-72 overflow-y-auto rounded-md border divide-y">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : displayControls.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{isSearching ? 'No controls match your search.' : 'No suggested controls found.'}</p>
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
                    <p className="text-sm font-medium leading-tight">{ctrl.refCode}</p>
                    {ctrl.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ctrl.description}</p>}
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
