'use client'
import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { InfoIcon, PanelRightClose, SearchIcon } from 'lucide-react'
import { Control, SubmitHandler, useForm } from 'react-hook-form'
import { infer as zInfer, z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AllGroupsPaginatedFieldsFragment,
  CreateInviteInput,
  GetAllGroupsPaginatedQueryVariables,
  GroupOrderField,
  GroupWhereInput,
  InputMaybe,
  InviteRole,
  OrderDirection,
} from '@repo/codegen/src/schema'
import { useCreateBulkInvite } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { Tag } from 'emblor'
import { useEffect, useMemo, useState } from 'react'
import { TagInput } from '@repo/ui/tag-input'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useAllGroupsGrouped } from '@/lib/graphql-hooks/groups.ts'
import { useDebounce } from '@uidotdev/usehooks'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { groupTableForInvitesColumns } from '../table/columns'
import { VisibilityState } from '@tanstack/react-table'
import { canCreate, canEdit } from '@/lib/authz/utils.ts'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

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
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.MEMBERS_INVITE_SHEET, DEFAULT_PAGINATION))
  const [selectedGroups, setSelectedGroups] = useState<AllGroupsPaginatedFieldsFragment[]>([])
  const { data: permission, isLoading: isLoadingPermission } = useOrganizationRoles()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    check: true,
  })

  const canInviteAdmins = canCreate(permission?.roles, AccessEnum.CanInviteAdmins)

  const [orderBy, setOrderBy] = useState<GetAllGroupsPaginatedQueryVariables['orderBy']>([
    {
      field: GroupOrderField.display_name,
      direction: OrderDirection.ASC,
    },
  ])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const where: GroupWhereInput = useMemo(() => {
    const whereFilters: GroupWhereInput[] = []
    if (debouncedSearchQuery) {
      whereFilters.push({ nameContainsFold: debouncedSearchQuery })
    }
    whereFilters.push({ isManaged: false })
    return { and: whereFilters }
  }, [debouncedSearchQuery])

  useEffect(() => {
    if (!isLoadingPermission) {
      const canEditPermission = canEdit(permission?.roles)

      setColumnVisibility((prev) => ({
        ...prev,
        check: canEditPermission,
      }))
    }
  }, [isLoadingPermission, permission])

  const { allGroups, isLoading } = useAllGroupsGrouped({ where: where as GroupWhereInput, enabled: isMemberSheetOpen, orderBy: orderByFilter })

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
    const inviteInput: InputMaybe<Array<CreateInviteInput> | CreateInviteInput> = data.emails.map((email) => {
      const baseInvite = {
        recipient: email,
        role: data.role,
      }

      if (selectedGroups.length > 0) {
        return {
          ...baseInvite,
          groupIDs: selectedGroups.map((group) => group.id),
        }
      }

      return baseInvite
    })

    try {
      await inviteMembers({
        input: inviteInput,
      })

      queryClient.invalidateQueries({ queryKey: ['invites'] })
      successNotification({
        title: `Invite${emails.length > 1 ? 's' : ''} sent successfully`,
      })
      handleClose()
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
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

  const roleOptions = useMemo(() => {
    const options = Object.entries(InviteRole).filter(([, o]) => o !== InviteRole.OWNER) as [keyof typeof InviteRole, InviteRole][]
    return canInviteAdmins ? options : options.filter(([, o]) => o !== InviteRole.ADMIN)
  }, [canInviteAdmins])

  const errorMessage = errors.emails && Array.isArray(errors.emails) && errors.emails.length > 0 ? errors.emails[0]?.message : null
  return (
    <Sheet open={isMemberSheetOpen} onOpenChange={setIsMemberSheetOpen}>
      <SheetContent
        initialWidth={846}
        className="flex flex-col"
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={handleClose} />
              <div className="flex justify-end gap-2">
                <CancelButton onClick={handleClose}></CancelButton>
                <Button iconPosition="left" type="button" form="inviteForm" onClick={handleSubmit(onSubmit)} disabled={emails.length === 0}>
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
        }
      >
        <>
          <Form {...form}>
            <form id="inviteForm" onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-10">
                <div className="grid grid-cols-4 gap-y-6 items-start">
                  <div className="flex items-center gap-1">
                    <p>
                      Email <span className="text-red-500">*</span>
                    </p>
                    <SystemTooltip icon={<InfoIcon size={14} />} content={<p>Enter or paste emails of the users to be invited to your organization</p>} />
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
                    <SystemTooltip
                      icon={<InfoIcon size={14} />}
                      content={<p>Choose a role to assign to the user(s). Admin will give the user full read and write permissions. Member will give the user read-only access.</p>}
                    />
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
                              {roleOptions.map(([key, value]) => (
                                <SelectItem key={value} value={value}>
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
          <div className="grid grid-cols-4 gap-y-6 items-start mt-2">
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
                onSortChange={setOrderBy}
                pagination={pagination}
                onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
                paginationMeta={{ totalCount: allGroups.length }}
                loading={isLoading}
                columnVisibility={columnVisibility}
                stickyDialogHeader
                tableKey={TableKeyEnum.MEMBERS_INVITE_SHEET}
              />
            </div>
          </div>
        </>
      </SheetContent>
    </Sheet>
  )
}

export default MembersInviteSheet
