'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebounce } from '@uidotdev/usehooks'
import { X, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { Form, FormField, FormItem, FormControl, FormMessage } from '@repo/ui/form'
import { useNotification } from '@/hooks/useNotification'
import { useCreateAssessmentResponse } from '@/lib/graphql-hooks/assessment'
import { useContacts } from '@/lib/graphql-hooks/contacts'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const formSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
})

type FormData = z.infer<typeof formSchema>
type ContactSuggestion = { email: string; label: string }

type SendQuestionnaireDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId?: string
  assessmentName?: string
}

const MIN_SEARCH_LENGTH = 3
const INVALID_EMAIL_MESSAGE = 'Please enter a valid email address.'
const DUPLICATE_EMAIL_MESSAGE = 'This email is already added.'

const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)
const normalizeEmail = (email: string) => email.trim()

export const SendQuestionnaireDialog = ({ open, onOpenChange, assessmentId, assessmentName }: SendQuestionnaireDialogProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createAssessmentResponse } = useCreateAssessmentResponse()

  const [emails, setEmails] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const debouncedSearch = useDebounce(normalizeEmail(inputValue), 250)

  const { contacts } = useContacts({
    where: {
      or: [{ emailContainsFold: debouncedSearch }, { fullNameContainsFold: debouncedSearch }],
    },
    enabled: open && debouncedSearch.length >= MIN_SEARCH_LENGTH,
  })

  const suggestions = useMemo<ContactSuggestion[]>(() => {
    const addedEmails = new Set(emails.map((e) => e.toLowerCase()))
    return (contacts ?? [])
      .filter((c) => c.email && !addedEmails.has(c.email.toLowerCase()))
      .map((c) => ({
        email: c.email!,
        label: c.fullName ? `${c.fullName} (${c.email})` : c.email!,
      }))
  }, [contacts, emails])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { emails: [] },
  })

  const syncEmails = useCallback(
    (nextEmails: string[], shouldValidate = nextEmails.length > 0) => {
      setEmails(nextEmails)
      form.setValue('emails', nextEmails, { shouldValidate })
    },
    [form],
  )

  const pendingInputEmail = useMemo(() => {
    const trimmed = normalizeEmail(inputValue)
    if (!trimmed || !isValidEmail(trimmed)) return null
    if (emails.some((e) => e.toLowerCase() === trimmed.toLowerCase())) return null
    return trimmed
  }, [inputValue, emails])

  const allEmailsToSend = useMemo(() => (pendingInputEmail ? [...emails, pendingInputEmail] : emails), [emails, pendingInputEmail])

  const addEmail = useCallback(
    (email: string): boolean => {
      const normalized = normalizeEmail(email)
      if (!normalized) return false

      if (!isValidEmail(normalized)) {
        setInputError(INVALID_EMAIL_MESSAGE)
        return false
      }

      if (emails.some((e) => e.toLowerCase() === normalized.toLowerCase())) {
        setInputError(DUPLICATE_EMAIL_MESSAGE)
        return false
      }

      setInputError(null)
      syncEmails([...emails, normalized], true)
      setInputValue('')
      setShowSuggestions(false)
      return true
    },
    [emails, syncEmails],
  )

  const selectContact = useCallback(
    (email: string) => {
      addEmail(email)
      inputRef.current?.focus()
    },
    [addEmail],
  )

  const removeEmail = useCallback(
    (emailToRemove: string) => {
      const updated = emails.filter((e) => e !== emailToRemove)
      syncEmails(updated, updated.length > 0)
      inputRef.current?.focus()
    },
    [emails, syncEmails],
  )

  const handleAddMore = useCallback(() => {
    if (normalizeEmail(inputValue)) {
      addEmail(inputValue)
    }
    inputRef.current?.focus()
  }, [inputValue, addEmail])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (normalizeEmail(inputValue)) {
          addEmail(inputValue)
        }
      }
    },
    [inputValue, addEmail],
  )

  const resetForm = useCallback(() => {
    setEmails([])
    setInputValue('')
    setInputError(null)
    setIsSending(false)
    setShowSuggestions(false)
    form.reset({ emails: [] })
  }, [form])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetForm()
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetForm],
  )

  const handleSend = async () => {
    const trimmed = normalizeEmail(inputValue)

    if (trimmed && !isValidEmail(trimmed)) {
      setInputError(INVALID_EMAIL_MESSAGE)
      return
    }

    if (!allEmailsToSend.length) {
      form.setValue('emails', [], { shouldValidate: true })
      return
    }

    if (!assessmentId) return

    form.setValue('emails', allEmailsToSend, { shouldValidate: true })
    const isValid = await form.trigger('emails')
    if (!isValid) return

    setIsSending(true)

    const results = await Promise.allSettled(
      allEmailsToSend.map((email) =>
        createAssessmentResponse({
          input: {
            email,
            assessmentID: assessmentId,
          },
        }),
      ),
    )

    const succeeded: string[] = []
    const failed: string[] = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        succeeded.push(allEmailsToSend[i])
      } else {
        failed.push(allEmailsToSend[i])
      }
    })

    if (succeeded.length > 0) {
      successNotification({
        title: `Questionnaire sent to ${succeeded.length} recipient${succeeded.length > 1 ? 's' : ''}`,
      })
    }

    if (failed.length > 0) {
      syncEmails(failed, true)
      setInputValue('')
      errorNotification({
        title: `Failed to send to ${failed.length} recipient${failed.length > 1 ? 's' : ''}`,
        description: failed.join(', '),
      })
      setIsSending(false)
    } else {
      handleOpenChange(false)
    }
  }

  const totalCount = allEmailsToSend.length
  const errorMessage = form.formState.errors.emails?.message ?? (Array.isArray(form.formState.errors.emails) && form.formState.errors.emails[0]?.message) ?? null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-full max-w-md overflow-visible"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          requestAnimationFrame(() => inputRef.current?.focus())
        }}
      >
        <DialogHeader>
          <DialogTitle>Send Questionnaire</DialogTitle>
          <DialogDescription>{assessmentName ? `Enter recipient emails to send "${assessmentName}".` : 'Enter recipient emails to send the questionnaire.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <FormField
            name="emails"
            control={form.control}
            render={() => (
              <FormItem>
                <FormControl>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          ref={inputRef}
                          type="email"
                          placeholder="Enter email address..."
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value)
                            setInputError(null)
                            setShowSuggestions(true)
                          }}
                          onKeyDown={handleKeyDown}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => setShowSuggestions(false), 150)
                          }}
                          maxWidth
                          autoFocus
                        />
                        {showSuggestions && normalizeEmail(inputValue).length >= MIN_SEARCH_LENGTH && suggestions.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                            <ul className="max-h-[200px] overflow-y-auto p-1">
                              {suggestions.map((s) => (
                                <li key={s.email}>
                                  <button
                                    type="button"
                                    className="w-full rounded-xs px-2 py-1.5 text-left text-sm hover:bg-muted transition-colors cursor-default"
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      selectContact(s.email)
                                    }}
                                  >
                                    {s.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button type="button" icon={<Plus />} iconPosition="left" variant="secondary" onClick={handleAddMore} className="shrink-0">
                        Add More
                      </Button>
                    </div>
                    {emails.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {emails.map((email) => (
                          <Badge key={email} variant="select" className="flex items-center gap-1.5 py-1.5 px-2.5 text-sm">
                            {email}
                            <button type="button" onClick={() => removeEmail(email)} className="rounded-full outline-hidden hover:opacity-70 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                {(inputError || errorMessage) && <FormMessage>{inputError ?? errorMessage}</FormMessage>}
              </FormItem>
            )}
          />
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <CancelButton />
          </DialogClose>
          <Button onClick={handleSend} disabled={isSending || totalCount === 0}>
            {isSending ? 'Sending...' : totalCount > 1 ? `Send (${totalCount})` : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
