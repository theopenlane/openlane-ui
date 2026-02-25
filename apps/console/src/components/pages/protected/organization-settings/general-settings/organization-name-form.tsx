'use client'
import { File } from '@repo/codegen/src/schema'
import { Input } from '@repo/ui/input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { z } from 'zod'
import { useEffect, useState, useContext } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useOrganization } from '@/hooks/useOrganization'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { useUpdateOrganization, useUpdateOrgAvatar } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'

const OrganizationNameForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { mutateAsync: uploadAvatar } = useUpdateOrgAvatar()
  const { setCrumbs } = useContext(BreadcrumbContext)

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, allOrgs } = useOrganization()
  const currentOrganization = allOrgs.filter((org) => org?.node?.id === currentOrgId)[0]?.node

  const image = currentOrganization?.avatarFile?.presignedURL || currentOrganization?.avatarRemoteURL || ''
  const formSchema = z.object({
    displayName: z.string().min(2, {
      message: 'Display name must be at least 2 characters',
    }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
    },
  })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'General Settings', href: '/general-settings' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (currentOrganization) {
      form.reset({
        displayName: currentOrganization.displayName,
      })
    }
  }, [currentOrganization, form])

  const updateOrganization = async ({ displayName }: { displayName: string }) => {
    if (!currentOrgId) {
      return
    }
    try {
      await updateOrg({
        updateOrganizationId: currentOrgId,
        input: {
          displayName: displayName,
        },
      })
      setIsSuccess(true)
      successNotification({
        title: 'Organization updated',
        description: 'Organization was successfully updated.',
      })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const [firstKey] = query.queryKey
          return firstKey === 'organizationsWithMembers' || firstKey === 'organizations'
        },
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await updateOrganization({ displayName: data.displayName })
  }

  const handleUploadAvatar = async (file: File) => {
    if (!currentOrgId) return
    try {
      await uploadAvatar({
        updateOrganizationId: currentOrgId,
        input: {},
        avatarFile: file,
      })
      setIsSuccess(true)
      successNotification({
        title: 'Avatar updated successfully',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false)
      }, RESET_SUCCESS_STATE_MS)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  return (
    <>
      <Panel>
        <PanelHeader
          heading="Organization name"
          subheading="This is the name of your organization, which will hold your data and other configuration. This would typically be the name of the company you work for or represent."
          noBorder
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="w-full">
                  <div className="flex gap-4 items-center">
                    <FormControl className="flex-1">
                      <Input {...field} variant="medium" className="h-10" />
                    </FormControl>

                    <SaveButton variant={isSuccess ? 'success' : 'primary'} title={isPending ? 'Saving Changes' : isSuccess ? 'Saved' : 'Save Changes'} />
                  </div>
                  <FormMessage className="mt-1 text-sm text-error" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </Panel>
      <AvatarUpload fallbackString={currentOrganization?.displayName?.substring(0, 2) || 'N/A'} uploadCallback={handleUploadAvatar} placeholderImage={image} />
    </>
  )
}

export { OrganizationNameForm }
