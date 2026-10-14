'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { FALLBACK_COLOR } from './constants'

type ColorCellProps = {
  id: string
  label: string
  initialColor?: string | null
  disabled?: boolean
  onSave: (id: string, newColor: string) => Promise<void>
}

const ColorSwatch = ({ color }: { color: string }) => (
  <>
    <span className="h-4 w-4 shrink-0 rounded-full border border-border shadow-sm" style={{ backgroundColor: color }} />
    <span className="font-mono text-xs uppercase text-muted-foreground">{color}</span>
  </>
)

const ColorCell = ({ id, label, initialColor, disabled, onSave }: ColorCellProps) => {
  const { successNotification, errorNotification } = useNotification()
  const saved = normalizeHexColor(initialColor) ?? FALLBACK_COLOR

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(saved)
  const [isSaving, setIsSaving] = useState(false)

  const normalizedDraft = normalizeHexColor(draft)
  const canSave = !!normalizedDraft && normalizedDraft.toUpperCase() !== saved.toUpperCase() && !isSaving

  if (disabled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-1.5 py-1 opacity-50">
        <ColorSwatch color={saved} />
      </div>
    )
  }

  const handleOpenChange = (next: boolean) => {
    if (isSaving) return
    if (next) setDraft(saved)
    setOpen(next)
  }

  const handleSave = async () => {
    if (!canSave || !normalizedDraft) return
    setIsSaving(true)
    try {
      await onSave(id, normalizedDraft.toUpperCase())
      successNotification({ title: 'Success', description: 'Color updated successfully' })
      setOpen(false)
    } catch (error) {
      errorNotification({ title: 'Update Failed', description: parseErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button" variant="transparent" size="sm" aria-label={`Edit color for ${label}`} className="group h-auto gap-1.5 px-1.5 py-1 hover:bg-muted">
          <ColorSwatch color={saved} />
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-64 flex-col gap-3 p-3">
        <ColorInput label={`Color for ${label}`} value={draft} onChange={setDraft} disabled={isSaving} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSave} disabled={!canSave} loading={isSaving}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ColorCell
