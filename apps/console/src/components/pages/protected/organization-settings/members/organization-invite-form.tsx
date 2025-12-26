'use client'
import React, { useState } from 'react'
import { useForm, SubmitHandler, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { TagInput } from '@repo/ui/tag-input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useNotification } from '@/hooks/useNotification'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Tag } from 'emblor'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'
import { organizationInviteStyles } from './organization-invite-form.styles'

import { CreateInviteInput, InputMaybe, InviteRole } from '@repo/codegen/src/schema'
import { useCreateBulkInvite } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const formSchema = z.object({
  emails: z.array(z.string().email({ message: 'Invalid email address' })),
  role: z
    .nativeEnum(InviteRole, {
      errorMap: () => ({ message: 'Invalid role' }),
    })
    .default(InviteRole.MEMBER),
})

type FormData = zInfer<typeof formSchema>

const OrganizationInviteForm = ({ inviteAdmins }: { inviteAdmins: boolean }) => {
  const { buttonRow, roleRow } = organizationInviteStyles()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const { mutateAsync: inviteMembers } = useCreateBulkInvite()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: InviteRole.MEMBER,
    },
  })

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const [emails, setEmails] = useState<Tag[]>([])
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const [currentValue, setCurrentValue] = useState('')
  const [invalidEmail, setInvalidEmail] = useState<string | null>(null)

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const inviteInput: InputMaybe<Array<CreateInviteInput> | CreateInviteInput> = data.emails.map((email) => ({
      recipient: email,
      role: data.role,
    }))

    try {
      await inviteMembers({
        input: inviteInput,
      })

      queryClient.invalidateQueries({ queryKey: ['invites'] })
      successNotification({
        title: `Invite${emails.length > 1 ? 's' : ''} sent successfully`,
      })
      setEmails([])
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }
  const errorMessage = errors.emails && Array.isArray(errors.emails) && errors.emails.length > 0 ? errors.emails[0]?.message : null

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleBlur = () => {
    if (isValidEmail(currentValue)) {
      const trimmed = currentValue.trim()
      const existing = emails.find((tag) => tag.text.toLowerCase() === trimmed.toLowerCase())

      if (!existing) {
        const newTag = { id: trimmed, text: trimmed }
        const updatedTags = [...emails, newTag]
        setEmails(updatedTags)
        setValue(
          'emails',
          updatedTags.map((tag) => tag.text),
        )
      }

      setCurrentValue('')
    }
  }

  return (
    <Panel>
      <PanelHeader heading="Invite new members" subheading="Enter or paste one or more email addresses, separated by commas." noBorder />
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="emails"
            control={control as unknown as Control<FormData>}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagInput
                    {...field}
                    tags={emails}
                    validateTag={(tag: string) => {
                      const isValid = isValidEmail(tag)
                      const isDuplicate = emails.some((email) => email.text === tag)

                      if (!isValid) {
                        setInvalidEmail('Your email is invalid.')
                        return false
                      }

                      if (isDuplicate) {
                        setInvalidEmail('This email is already added.')
                        return false
                      }

                      setInvalidEmail(null)
                      return true
                    }}
                    setTags={(newTags: Tag[]) => {
                      const emailTags = newTags.map((tag) => tag.text)
                      setEmails(newTags)
                      setValue('emails', emailTags)
                      setCurrentValue('')
                    }}
                    activeTagIndex={activeTagIndex}
                    setActiveTagIndex={setActiveTagIndex}
                    inputProps={{ value: currentValue }}
                    onInputChange={(newValue: string) => setCurrentValue(newValue)}
                    onBlur={handleBlur}
                  />
                </FormControl>
                {(errorMessage || invalidEmail) && <FormMessage>{errorMessage ?? invalidEmail}</FormMessage>}
              </FormItem>
            )}
          />

          <div className={buttonRow()}>
            <div className={roleRow()}>
              Role:{' '}
              <FormField
                name="role"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(InviteRole)
                            .reverse()
                            .filter(([key]) => !key.includes('USER'))
                            .filter(([key]) => {
                              if (!inviteAdmins) {
                                return !key.includes('ADMIN')
                              }

                              return true
                            })
                            .map(([key, value], i) => (
                              <SelectItem key={i} value={value}>
                                {key[0].toUpperCase() + key.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {errors.role && <FormMessage>{errors.role.message}</FormMessage>}
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={emails.length === 0}>
              Send Invitation{emails.length > 1 && 's'}
            </Button>
          </div>
        </form>
      </Form>
    </Panel>
  )
}

export { OrganizationInviteForm }
