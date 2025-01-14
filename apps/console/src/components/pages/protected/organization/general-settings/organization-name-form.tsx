'use client'
import { useGetAllOrganizationsQuery, useUpdateOrganizationMutation } from '@repo/codegen/src/schema'
import { Input, InputRow } from '@repo/ui/input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { z } from 'zod'
import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useOrganization } from '@/hooks/useOrganization'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'

const OrganizationNameForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const [{ fetching: isSubmitting }, updateOrg] = useUpdateOrganizationMutation()

  const { currentOrgId, allOrgs } = useOrganization()
  const currentOrganization = allOrgs.filter((org) => org?.node?.id === currentOrgId)[0]?.node

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
    await updateOrg({
      updateOrganizationId: currentOrgId,
      input: {
        displayName: displayName,
      },
    })
    setIsSuccess(true)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await updateOrganization({ displayName: data.displayName })
  }

  const handleUploadAvatar = async (file: File) => {
    if (!currentOrgId) return
    // try {
    //   await updateOrg({
    //     updateOrganizationId: currentOrgId,
    //     input: {},
    //   })
    //   setIsSuccess(true)
    // } catch (error) {
    //   console.error('file upload error')
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
              <Button variant={isSuccess ? 'success' : 'filled'} type="submit" loading={isSubmitting}>
                {isSubmitting ? 'Saving' : isSuccess ? 'Saved' : 'Save'}
              </Button>
            </InputRow>
          </form>
        </Form>
      </Panel>
      <AvatarUpload uploadCallback={handleUploadAvatar} placeholderImage={currentOrganization?.avatarRemoteURL || ''} />
    </>
  )
}

export { OrganizationNameForm }
