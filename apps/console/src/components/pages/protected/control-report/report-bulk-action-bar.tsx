'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Checkbox } from '@repo/ui/checkbox'
import { UserCog, Tag, X, FolderPlus } from 'lucide-react'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { ControlStatusOptions } from '@/components/shared/enum-mapper/control-enum'
import { type BulkActionInput, type BulkActionOptions } from './use-report-selection'

const BULK_STATUS_OPTIONS = ControlStatusOptions.filter((opt) => opt.value !== ControlControlStatus.ARCHIVED && opt.value !== ControlControlStatus.NOT_APPLICABLE)

type BulkEditGroup = { id: string; displayName?: string | null }

type ReportBulkActionBarProps = {
  selectedControlCount: number
  selectedSubcontrolCount: number
  isCustomView: boolean
  groups: BulkEditGroup[]
  programOptions: { value: string; label: string }[]
  onApply: (input: BulkActionInput, options: BulkActionOptions) => void
  onClear: () => void
}

const ReportBulkActionBar: React.FC<ReportBulkActionBarProps> = ({ selectedControlCount, selectedSubcontrolCount, isCustomView, groups, programOptions, onApply, onClear }) => {
  const [ownerPopoverOpen, setOwnerPopoverOpen] = useState(false)
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)
  const [programPopoverOpen, setProgramPopoverOpen] = useState(false)
  const [pendingOwnerId, setPendingOwnerId] = useState('')
  const [pendingStatus, setPendingStatus] = useState<ControlControlStatus | ''>('')
  const [pendingProgramId, setPendingProgramId] = useState('')
  const [ownerCascade, setOwnerCascade] = useState({ sub: false, mapped: false })
  const [statusCascade, setStatusCascade] = useState({ sub: false, mapped: false })
  const [programMappedCascade, setProgramMappedCascade] = useState(false)

  const selectionLabel = [
    selectedControlCount > 0 ? `${selectedControlCount} control${selectedControlCount > 1 ? 's' : ''}` : '',
    selectedSubcontrolCount > 0 ? `${selectedSubcontrolCount} subcontrol${selectedSubcontrolCount > 1 ? 's' : ''}` : '',
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="flex items-center gap-3 mt-3 px-3 py-2 rounded-md border border-border bg-muted/40">
      <span className="text-sm font-medium">{selectionLabel} selected</span>

      <Popover open={ownerPopoverOpen} onOpenChange={setOwnerPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-7.5 px-3 gap-1.5" icon={<UserCog size={14} />} iconPosition="left">
            Assign Owner
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-4">
          <p className="text-sm font-medium">Assign Owner</p>
          <Select value={pendingOwnerId} onValueChange={setPendingOwnerId}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select group…" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.displayName ?? g.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox checked={ownerCascade.sub} onCheckedChange={(v) => setOwnerCascade((prev) => ({ ...prev, sub: !!v }))} />
            Apply to subcontrols
          </label>
          {!isCustomView && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={ownerCascade.mapped} onCheckedChange={(v) => setOwnerCascade((prev) => ({ ...prev, mapped: !!v }))} />
              Apply to mapped org controls
            </label>
          )}
          <Button
            variant="primary"
            className="w-full h-8"
            disabled={!pendingOwnerId}
            onClick={() => {
              onApply({ controlOwnerID: pendingOwnerId }, { subcontrols: ownerCascade.sub, mappedControls: ownerCascade.mapped })
              setOwnerPopoverOpen(false)
              setPendingOwnerId('')
              setOwnerCascade({ sub: false, mapped: false })
            }}
          >
            Apply
          </Button>
        </PopoverContent>
      </Popover>

      <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-7.5 px-3 gap-1.5" icon={<Tag size={14} />} iconPosition="left">
            Set Status
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-4">
          <p className="text-sm font-medium">Set Status</p>
          <Select value={pendingStatus} onValueChange={(v) => setPendingStatus(v as ControlControlStatus)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select status…" />
            </SelectTrigger>
            <SelectContent>
              {BULK_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox checked={statusCascade.sub} onCheckedChange={(v) => setStatusCascade((prev) => ({ ...prev, sub: !!v }))} />
            Apply to subcontrols
          </label>
          {!isCustomView && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={statusCascade.mapped} onCheckedChange={(v) => setStatusCascade((prev) => ({ ...prev, mapped: !!v }))} />
              Apply to mapped org controls
            </label>
          )}
          <Button
            variant="primary"
            className="w-full h-8"
            disabled={!pendingStatus}
            onClick={() => {
              onApply({ status: pendingStatus || undefined }, { subcontrols: statusCascade.sub, mappedControls: statusCascade.mapped })
              setStatusPopoverOpen(false)
              setPendingStatus('')
              setStatusCascade({ sub: false, mapped: false })
            }}
          >
            Apply
          </Button>
        </PopoverContent>
      </Popover>

      <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-7.5 px-3 gap-1.5" icon={<FolderPlus size={14} />} iconPosition="left">
            Assign to Program
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3 p-4">
          <p className="text-sm font-medium">Assign to Program</p>
          {selectedControlCount === 0 ? (
            <p className="text-xs text-muted-foreground">Select at least one control to assign to a program. Subcontrols cannot be assigned directly.</p>
          ) : (
            <>
              <Select value={pendingProgramId} onValueChange={setPendingProgramId}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select program…" />
                </SelectTrigger>
                <SelectContent>
                  {programOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isCustomView && (
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={programMappedCascade} onCheckedChange={(v) => setProgramMappedCascade(!!v)} />
                  Apply to mapped org controls
                </label>
              )}
              <Button
                variant="primary"
                className="w-full h-8"
                disabled={!pendingProgramId}
                onClick={() => {
                  onApply({ addProgramIDs: [pendingProgramId] }, { subcontrols: false, mappedControls: programMappedCascade })
                  setProgramPopoverOpen(false)
                  setPendingProgramId('')
                  setProgramMappedCascade(false)
                }}
              >
                Apply
              </Button>
            </>
          )}
        </PopoverContent>
      </Popover>

      <Button variant="outline" className="h-7.5 px-2 ml-auto" icon={<X size={14} />} iconPosition="left" onClick={onClear}>
        Clear
      </Button>
    </div>
  )
}

export default ReportBulkActionBar
