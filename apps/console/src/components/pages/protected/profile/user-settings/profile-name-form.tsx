'use client'
import { GetUserProfileQueryVariables, useGetUserProfileQuery, useUpdateUserMutation } from '@repo/codegen/src/schema'
import { Input, InputRow } from '@repo/ui/input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage, FormLabel } from '@repo/ui/form'
import { z } from 'zod'
import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { AvatarUpload } from '@/components/shared/avatar-upload/avatar-upload'
import { toast } from '@repo/ui/use-toast'

const ProfileNameForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const [{ fetching: isSubmitting }, updateUserName] = useUpdateUserMutation()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const variables: GetUserProfileQueryVariables = {
    userId: userId ?? '',
  }

  const [{ data: userData }] = useGetUserProfileQuery({
    variables,
  })

  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: 'First name must be at least 2 characters',
    }),
    lastName: z.string().min(2, {
      message: 'Last name must be at least 2 characters',
    }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: userData?.user.firstName || '',
      lastName: userData?.user.lastName || '',
    },
  })

  const updateName = async ({ firstName, lastName }: { firstName: string; lastName: string }) => {
    await updateUserName({
      updateUserId: userId,
      input: {
        firstName: firstName,
        lastName: lastName,
      },
    })
    setIsSuccess(true)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await updateName({ firstName: data.firstName, lastName: data.lastName })
  }

  const handleUploadAvatar = async (file: File) => {
    if (!userId) return

    try {
      await updateUserName({
        updateUserId: userId,
        input: {},
        avatarFile: file,
      })

      setIsSuccess(true)
      toast({
        title: 'Avatar updated successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('file upload error')
      toast({
        title: 'Failed to update avatar',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.user.firstName ?? '',
        lastName: userData.user.lastName ?? '',
      })
    }
  }, [userData])

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
        <PanelHeader heading="Your name" noBorder />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <InputRow>
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input variant="medium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
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
      <AvatarUpload
        fallbackString={sessionData?.user?.name?.substring(0, 2)}
        uploadCallback={handleUploadAvatar || 'N/A'}
        placeholderImage={userData?.user.avatarFile?.presignedURL || sessionData?.user?.image}
      />
    </>
  )
}

export { ProfileNameForm }
