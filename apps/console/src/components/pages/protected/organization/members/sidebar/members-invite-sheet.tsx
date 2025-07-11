'use client'
import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ArrowRight } from 'lucide-react'
import { SubmitHandler, useForm, Control } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateInviteInput, InputMaybe, InviteRole } from '@repo/codegen/src/schema'
import { useCreateBulkInvite } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { Tag } from 'emblor'
import { useState } from 'react'
import { InfoIcon } from 'lucide-react'
import { TagInput } from '@repo/ui/tag-input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'

const formSchema = z.object({
  emails: z.array(z.string().email({ message: 'Invalid email address' })),
  role: z
    .nativeEnum(InviteRole, {
      errorMap: () => ({ message: 'Invalid role' }),
    })
    .default(InviteRole.MEMBER),
})

type FormData = zInfer<typeof formSchema>

type TMembersInviteSheet = {
  isMemberSheetOpen: boolean
  setIsMemberSheetOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const MembersInviteSheet = ({ isMemberSheetOpen, setIsMemberSheetOpen }: TMembersInviteSheet) => {
  const { mutateAsync: inviteMembers } = useCreateBulkInvite()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()
  const [emails, setEmails] = useState<Tag[]>([])
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const [currentValue, setCurrentValue] = useState('')
  const [invalidEmail, setInvalidEmail] = useState<string | null>(null)

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

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    console.log('submit')
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
      setIsMemberSheetOpen(false)
    } catch {
      errorNotification({
        title: 'Unexpected error occurred, invites not sent',
      })
    }
  }

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
  const errorMessage = errors.emails && Array.isArray(errors.emails) && errors.emails.length > 0 ? errors.emails[0]?.message : null
  return (
    <Sheet open={isMemberSheetOpen} onOpenChange={setIsMemberSheetOpen}>
      <SheetContent className="bg-card flex flex-col">
        <>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-10">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <ArrowRight size={16} className="cursor-pointer" onClick={() => setIsMemberSheetOpen(false)} />
                    <div className="flex justify-end gap-2">
                      <Button iconPosition="left" variant="back" onClick={() => setIsMemberSheetOpen(false)}>
                        Cancel
                      </Button>
                      <Button iconPosition="left" type="submit" disabled={emails.length === 0}>
                        Invite
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-start">
                    <SheetTitle>
                      <h3 className="font-medium text-2xl text-text-header">Invite new member</h3>
                    </SheetTitle>
                  </div>
                </SheetHeader>
                <div className="flex flex-col gap-8">
                  <div className="flex flex-row items-center gap-4">
                    <div className="flex flex items-center">
                      <div className="flex flex-row items-start">
                        <p>Email</p>
                        <span className="text-red-500"> *</span>
                        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Enter or paste emails</p>} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center w-full">
                      <FormField
                        name="emails"
                        control={control as unknown as Control<FormData>}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl>
                              <div className="flex flex items-center gap-4">
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
                              </div>
                            </FormControl>
                            {(errorMessage || invalidEmail) && <FormMessage>{errorMessage ?? invalidEmail}</FormMessage>}
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-6">
                    <div className="flex flex items-center">
                      <div className="flex flex-row items-start">
                        <p>Role</p>
                        <span className="text-red-500"> *</span>
                        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Choose role</p>} />
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <FormField
                        name="role"
                        control={control}
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(InviteRole).map(([key, value], i) => (
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
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </>
      </SheetContent>
    </Sheet>
  )
}

export default MembersInviteSheet
