'use client'

import React, { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CVSS_VECTOR_ERROR, explainCvssVector, parseCvssVector } from '@/utils/cvss-vector'

type TAddVectorDialogProps = {
  onSave: (vector: string) => Promise<boolean>
}

const AddVectorDialog: React.FC<TAddVectorDialogProps> = ({ onSave }) => {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = value.trim()
  const preview = explainCvssVector(trimmed)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setValue('')
      setError(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!parseCvssVector(trimmed)) {
      setError(CVSS_VECTOR_ERROR)
      return
    }
    setIsSaving(true)
    const saved = await onSave(trimmed)
    setIsSaving(false)
    if (saved) handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" icon={<Plus size={16} />} iconPosition="left">
          Add vector
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add CVSS vector</DialogTitle>
            <DialogDescription>Paste the vector string from the advisory, for example CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={inputId}>Vector</Label>
            <Input
              id={inputId}
              className="font-mono"
              value={value}
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
            />
            {error && (
              <p id={errorId} className="text-sm text-destructive">
                {error}
              </p>
            )}
            {preview && <p className="text-sm text-muted-foreground">{preview}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <SaveButton isSaving={isSaving} disabled={!trimmed || isSaving} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddVectorDialog
