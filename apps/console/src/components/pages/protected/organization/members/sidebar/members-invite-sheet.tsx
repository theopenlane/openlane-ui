'use client'
import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ArrowRight } from 'lucide-react'
import { SubmitHandler, useForm, Control } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AllGroupsPaginatedFieldsFragment, CreateInviteInput, InputMaybe, InviteRole } from '@repo/codegen/src/schema'
import { useCreateBulkInvite } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { Tag } from 'emblor'
import { useEffect, useMemo, useState } from 'react'
import { InfoIcon, SearchIcon } from 'lucide-react'
import { TagInput } from '@repo/ui/tag-input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'
import { useAllGroupsGrouped } from '@/lib/graphql-hooks/groups.ts'
import { GroupWhereInput } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { Input } from '@repo/ui/input'
import { DataTable } from '@repo/ui/data-table'
import { groupTableForInvitesColumns } from '../table/columns'
import { VisibilityState } from '@tanstack/react-table'
import { useOrganizationRole } from '@/lib/authz/access-api.ts'
import { canEdit } from '@/lib/authz/utils.ts'

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
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [selectedGroups, setSelectedGroups] = useState<AllGroupsPaginatedFieldsFragment[]>([])
  const { data: permission, isLoading: isLoadingPermission } = useOrganizationRole(session)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    check: true,
  })

  const where: GroupWhereInput = useMemo(() => (debouncedSearchQuery ? { nameContainsFold: debouncedSearchQuery } : {}), [debouncedSearchQuery])

  useEffect(() => {
    if (!isLoadingPermission) {
      const canEditPermission = canEdit(permission?.roles)

      setColumnVisibility((prev) => ({
        ...prev,
        check: canEditPermission,
      }))
    }
  }, [isLoadingPermission, permission])

  const { allGroups, isLoading } = useAllGroupsGrouped({ where: where as GroupWhereInput, enabled: isMemberSheetOpen })

  const pagedData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return allGroups.slice(start, start + pagination.pageSize)
  }, [allGroups, pagination.page, pagination.pageSize])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: InviteRole.MEMBER,
    },
  })

  const columns = useMemo(() => {
    return groupTableForInvitesColumns({ allGroups, selectedGroups, setSelectedGroups })
  }, [allGroups, selectedGroups])

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const inviteInput: InputMaybe<Array<CreateInviteInput> | CreateInviteInput> = data.emails.map((email) => ({
      recipient: email,
      role: data.role,
    }))
    try {
      await inviteMembers({
        input: inviteInput,
        /*TODO: ADD GROUPS WHEN BACKEND EXPANDS*/
      })

      queryClient.invalidateQueries({ queryKey: ['invites'] })
      successNotification({
        title: `Invite${emails.length > 1 ? 's' : ''} sent successfully`,
      })
      handleClose()
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

  const handleClose = () => {
    setEmails([])
    setSearchQuery('')
    setSelectedGroups([])
    setIsMemberSheetOpen(false)
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
                    <ArrowRight size={16} className="cursor-pointer" onClick={handleClose} />
                    <div className="flex justify-end gap-2">
                      <Button type="button" iconPosition="left" variant="back" onClick={handleClose}>
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
                <div className="grid grid-cols-4 gap-y-6 items-start">
                  <div className="flex items-center gap-1">
                    <p>
                      Email <span className="text-red-500">*</span>
                    </p>
                    <SystemTooltip icon={<InfoIcon size={14} />} content={<p>Enter or paste emails</p>} />
                  </div>
                  <div className="col-span-3">
                    <FormField
                      name="emails"
                      control={control as unknown as Control<FormData>}
                      render={({ field }) => (
                        <FormItem className="w-full">
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
                              onInputChange={setCurrentValue}
                              onBlur={handleBlur}
                            />
                          </FormControl>
                          {(errorMessage || invalidEmail) && <FormMessage>{errorMessage ?? invalidEmail}</FormMessage>}
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <p>
                      Role <span className="text-red-500">*</span>
                    </p>
                    <SystemTooltip icon={<InfoIcon size={14} />} content={<p>Choose role</p>} />
                  </div>
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
            </form>
          </Form>
          <div className="grid grid-cols-4 gap-y-6 items-start">
            <div className="flex items-center gap-1">
              <p>Assign to group(s)</p>
              <SystemTooltip icon={<InfoIcon size={14} />} content={<p>Assign to group</p>} />
            </div>
            <div className="w-[200px]">
              <Input
                value={searchQuery}
                name="groupSearch"
                placeholder="Search..."
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                icon={<SearchIcon width={17} />}
                iconPosition="left"
                variant="searchTable"
              />
            </div>
            <div className="col-span-3 col-start-2">
              <DataTable
                columns={columns}
                data={pagedData}
                pagination={pagination}
                onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
                paginationMeta={{ totalCount: allGroups.length }}
                loading={isLoading}
                columnVisibility={columnVisibility}
                stickyDialogHeader
              />
            </div>
          </div>
        </>
      </SheetContent>
    </Sheet>
  )
}

export default MembersInviteSheet
