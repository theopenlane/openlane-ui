'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Tag } from 'emblor'
import { useDebounce } from '@uidotdev/usehooks'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { Form, FormField, FormItem, FormControl, FormMessage } from '@repo/ui/form'
import { TagInput } from '@repo/ui/tag-input'
import { useNotification } from '@/hooks/useNotification'
import { useCreateAssessmentResponse } from '@/lib/graphql-hooks/assessments'
import { useContacts } from '@/lib/graphql-hooks/contacts'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const formSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email is required'),
})

type FormData = z.infer<typeof formSchema>

type SendQuestionnaireDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessmentId?: string
  assessmentName?: string
}

export const SendQuestionnaireDialog = ({ open, onOpenChange, assessmentId, assessmentName }: SendQuestionnaireDialogProps) => {
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createAssessmentResponse } = useCreateAssessmentResponse()

  const [tags, setTags] = useState<Tag[]>([])
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const [currentInput, setCurrentInput] = useState('')
  const [invalidEmail, setInvalidEmail] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const debouncedSearch = useDebounce(currentInput, 300)

  const { contacts } = useContacts({
    where: {
      or: [{ emailContainsFold: debouncedSearch }, { fullNameContainsFold: debouncedSearch }],
    },
    enabled: open && debouncedSearch.length >= 2,
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { emails: [] },
  })

  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  const autocompleteOptions = useMemo(() => {
    const addedEmails = new Set(tags.map((t) => t.text.toLowerCase()))
    return (contacts ?? [])
      .filter((c) => c.email && !addedEmails.has(c.email.toLowerCase()))
      .map((c) => ({
        id: c.email!,
        text: c.fullName ? `${c.fullName} <${c.email}>` : c.email!,
      }))
  }, [contacts, tags])

  const handleSetTags = useCallback(
    (newTags: Tag[]) => {
      const normalized = newTags.map((tag) => {
        const emailMatch = tag.text.match(/<(.+?)>/)
        const email = emailMatch ? emailMatch[1] : tag.text
        return { id: email, text: email }
      })
      setTags(normalized)
      form.setValue(
        'emails',
        normalized.map((t) => t.text),
        { shouldValidate: normalized.length > 0 },
      )
      setCurrentInput('')
    },
    [form],
  )

  const handleBlur = useCallback(() => {
    const trimmed = currentInput.trim()
    if (trimmed && isValidEmail(trimmed)) {
      const existing = tags.find((tag) => tag.text.toLowerCase() === trimmed.toLowerCase())
      if (!existing) {
        const newTag = { id: trimmed, text: trimmed }
        const updatedTags = [...tags, newTag]
        setTags(updatedTags)
        form.setValue(
          'emails',
          updatedTags.map((t) => t.text),
          { shouldValidate: true },
        )
      }
      setCurrentInput('')
    }
  }, [currentInput, tags, form])

  const resetForm = useCallback(() => {
    setTags([])
    setActiveTagIndex(null)
    setCurrentInput('')
    setInvalidEmail(null)
    setIsSending(false)
    form.reset({ emails: [] })
  }, [form])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm()
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange, resetForm],
  )

  const handleSend = async () => {
    handleBlur()

    const currentEmails = form.getValues('emails')
    if (!currentEmails.length || !assessmentId) return

    const isValid = await form.trigger('emails')
    if (!isValid) return

    setIsSending(true)

    const results = await Promise.allSettled(
      currentEmails.map((email) =>
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
        succeeded.push(currentEmails[i])
      } else {
        failed.push(currentEmails[i])
      }
    })

    if (succeeded.length > 0) {
      successNotification({
        title: `Questionnaire sent to ${succeeded.length} recipient${succeeded.length > 1 ? 's' : ''}`,
      })
    }

    if (failed.length > 0) {
      const failedTags = failed.map((email) => ({ id: email, text: email }))
      setTags(failedTags)
      form.setValue('emails', failed, { shouldValidate: true })
      errorNotification({
        title: `Failed to send to ${failed.length} recipient${failed.length > 1 ? 's' : ''}`,
        description: failed.join(', '),
      })
      setIsSending(false)
    } else {
      handleOpenChange(false)
    }
  }

  const emailCount = tags.length
  const errorMessage = form.formState.errors.emails?.message ?? (Array.isArray(form.formState.errors.emails) && form.formState.errors.emails[0]?.message) ?? null

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Questionnaire</AlertDialogTitle>
          <AlertDialogDescription>{assessmentName ? `Enter recipient emails to send "${assessmentName}".` : 'Enter recipient emails to send the questionnaire.'}</AlertDialogDescription>
        </AlertDialogHeader>
        <Form {...form}>
          <FormField
            name="emails"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagInput
                    {...field}
                    tags={tags}
                    validateTag={(tag: string) => {
                      const emailMatch = tag.match(/<(.+?)>/)
                      const email = emailMatch ? emailMatch[1] : tag

                      const isValid = isValidEmail(email)
                      const isDuplicate = tags.some((t) => t.text.toLowerCase() === email.toLowerCase())

                      if (!isValid) {
                        setInvalidEmail('Please enter a valid email address.')
                        return false
                      }
                      if (isDuplicate) {
                        setInvalidEmail('This email is already added.')
                        return false
                      }
                      setInvalidEmail(null)
                      return true
                    }}
                    setTags={handleSetTags}
                    activeTagIndex={activeTagIndex}
                    setActiveTagIndex={setActiveTagIndex}
                    inputProps={{ value: currentInput, placeholder: 'Enter email addresses...' }}
                    onInputChange={(value: string) => setCurrentInput(value)}
                    onBlur={handleBlur}
                    enableAutocomplete={autocompleteOptions.length > 0}
                    autocompleteOptions={autocompleteOptions}
                    restrictTagsToAutocompleteOptions={false}
                  />
                </FormControl>
                {(errorMessage || invalidEmail) && <FormMessage>{errorMessage ?? invalidEmail}</FormMessage>}
              </FormItem>
            )}
          />
        </Form>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <CancelButton />
          </AlertDialogCancel>
          <Button onClick={handleSend} disabled={isSending || emailCount === 0}>
            {isSending ? 'Sending...' : emailCount > 1 ? `Send (${emailCount})` : 'Send'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
