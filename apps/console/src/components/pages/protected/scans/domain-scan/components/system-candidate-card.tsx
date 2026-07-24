'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Separator } from '@repo/ui/separator'
import { Textarea } from '@repo/ui/textarea'

type SystemCandidateCardProps = {
  name: string
  namePlaceholder: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onRemove: () => void
  alreadyExists: boolean
}

export const SystemCandidateCard = ({ name, namePlaceholder, description, onNameChange, onDescriptionChange, onRemove, alreadyExists }: SystemCandidateCardProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 px-6 py-3">
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-base font-semibold">
            {name || 'New system'}
            {alreadyExists ? <Badge variant="secondary">Already added</Badge> : null}
          </span>
          {!open && description ? <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
            {open ? 'Done' : 'Edit'}
          </Button>
          <Button variant="secondary" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      {open ? (
        <>
          <Separator separatorClass="bg-border" />
          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">System name</label>
              <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder={namePlaceholder} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Description <span className="font-normal text-muted-foreground">- Optional</span>
              </label>
              <Textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Add a short description of this system" />
            </div>
          </div>
        </>
      ) : null}
    </Card>
  )
}
