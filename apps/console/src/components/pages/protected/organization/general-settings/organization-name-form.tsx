'use client'
import { File } from '@repo/codegen/src/schema'
import { Input, InputRow } from '@repo/ui/input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { z } from 'zod'
import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useOrganization } from '@/hooks/useOrganization'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { useUpdateOrganization, useUpdateOrgAvatar } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification'

const OrganizationNameForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { isPending: uploading, mutateAsync: uploadAvatar } = useUpdateOrgAvatar()

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
    if (currentOrganization) {
      form.reset({
        displayName: currentOrganization.displayName,
      })
    }
  }, [currentOrganization])

  const updateOrganization = async ({ displayName }: { displayName: string }) => {
    if (!currentOrgId) {
      return
    }
    await updateOrg({
      updateOrganizationId: currentOrgId,
      input: {
        displayName: displayName,
      },
    })
    setIsSuccess(true)
    queryClient.invalidateQueries({
      predicate: (query) => {
        const [firstKey] = query.queryKey
        return firstKey === 'organizationsWithMembers' || firstKey === 'organizations'
      },
    })
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
      console.error('file upload error')
      errorNotification({
        title: 'Failed to update avatar',
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
            <InputRow>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input variant="medium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button variant={isSuccess ? 'success' : 'filled'} type="submit" loading={isPending}>
                {isPending ? 'Saving' : isSuccess ? 'Saved' : 'Save'}
              </Button>
            </InputRow>
          </form>
        </Form>
      </Panel>
      <AvatarUpload fallbackString={currentOrganization?.displayName?.substring(0, 2) || 'N/A'} uploadCallback={handleUploadAvatar} placeholderImage={image} />
    </>
  )
}

export { OrganizationNameForm }
