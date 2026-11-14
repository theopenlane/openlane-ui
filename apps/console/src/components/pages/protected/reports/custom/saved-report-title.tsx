'use client'

import React, { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Input } from '@repo/ui/input'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { useNotification } from '@/hooks/useNotification'
import { invalidateReportQueries, useUpdateReport, type TSavedReportRef } from '@/lib/graphql-hooks/report'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TSavedReportTitleProps = {
  report: Pick<TSavedReportRef, 'id' | 'name'>
  canRename: boolean
}

const SavedReportTitle: React.FC<TSavedReportTitleProps> = ({ report, canRename }) => {
  const queryClient = useQueryClient()
  const { errorNotification, successNotification } = useNotification()
  const { mutateAsync: updateReport } = useUpdateReport()
  const [draft, setDraft] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inFlightRef = useRef(false)
  const cancelledRef = useRef(false)

  const startEditing = () => {
    cancelledRef.current = false
    setDraft(report.name)
  }

  const commit = async () => {
    if (draft === null || cancelledRef.current || inFlightRef.current) return

    const name = draft.trim()
    if (!name || name === report.name) {
      setDraft(null)
      return
    }

    inFlightRef.current = true
    setIsSaving(true)
    try {
      await updateReport({ updateReportId: report.id, input: { name } })
      await invalidateReportQueries(queryClient)
      successNotification({ title: 'Report renamed', description: `"${name}" was saved.` })
      setDraft(null)
    } catch (error) {
      errorNotification({ title: 'Could not rename report', description: parseErrorMessage(error) })
      inputRef.current?.focus()
    } finally {
      inFlightRef.current = false
      setIsSaving(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }

    if (event.key === 'Escape' && !isSaving) {
      cancelledRef.current = true
      setDraft(null)
    }
  }

  if (draft !== null) {
    return (
      <div className="w-72 max-w-full min-w-0">
        <Input
          ref={inputRef}
          autoFocus
          aria-label="Report name"
          value={draft}
          readOnly={isSaving}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={() => void commit()}
          onKeyDown={handleKeyDown}
        />
      </div>
    )
  }

  return (
    <HoverPencilWrapper showPencil={canRename} onPencilClick={startEditing} pencilAriaLabel="Rename report" pencilClass="opacity-100" className="min-w-0 max-w-full">
      <div role="presentation" className="min-w-0 text-sm font-medium" onDoubleClick={canRename ? startEditing : undefined}>
        <TruncatedCell portal>{report.name}</TruncatedCell>
      </div>
    </HoverPencilWrapper>
  )
}

export default SavedReportTitle
