'use client'

import { Input, InputRow } from '@repo/ui/input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage, FormLabel } from '@repo/ui/form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useNotification } from '@/hooks/useNotification'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import { useGetCurrentUser, useUpdateUser } from '@/lib/graphql-hooks/user'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'

const ProfileNameForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const { isPending: isSubmitting, mutateAsync: updateUserName } = useUpdateUser()
  const { successNotification, errorNotification } = useNotification()

  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const { data: userData } = useGetCurrentUser(userId)

  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: 'First name must be at least 2 characters',
    }),
    lastName: z.string().min(2, {
      message: 'Last name must be at least 2 characters',
    }),
    displayName: z.string().min(2, {
      message: 'Display name must be at least 2 characters',
    }),
    email: z.string().email({
      message: 'Invalid email address',
    }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: userData?.user.firstName || '',
      lastName: userData?.user.lastName || '',
      displayName: userData?.user.displayName || '',
      email: userData?.user.email || '',
    },
  })

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await updateUserName({
        updateUserId: userId,
        input: {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          email: data.email,
        },
      })
      setIsSuccess(true)
      successNotification({ title: 'Profile updated successfully!' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.user.firstName ?? '',
        lastName: userData.user.lastName ?? '',
        displayName: userData?.user.displayName ?? '',
        email: userData?.user.email ?? '',
      })
    }
  }, [userData, form])

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        setIsSuccess(false)
      }, RESET_SUCCESS_STATE_MS)
      return () => clearTimeout(timer)
    }
  }, [isSuccess])

  return (
    <Panel>
      <PanelHeader heading="Your Profile" noBorder />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <InputRow className="gap-8">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel>First name</FormLabel>
                    <TooltipProvider disableHoverableContent={true}>
                      <Tooltip>
                        <TooltipTrigger type="button" className="bg-unset">
                          <InfoIcon size={14} className="mx-1 mt-1" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Your official name as recognized on legal documents like IDs, tax forms, or contracts.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger type="button" className="bg-unset">
                        <InfoIcon size={14} className="mx-1 mt-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Your official last name as recognized on legal documents like IDs, tax forms, or contracts.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <InputRow className="gap-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger type="button" className="bg-unset">
                        <InfoIcon size={14} className="mx-1 mt-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Your display name is what other users will see.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger type="button" className="bg-unset">
                        <InfoIcon size={14} className="mx-1 mt-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Your email address used for login as well as for communication and account-related updates.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <FormControl>
                    <Input variant="medium" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </InputRow>
          <SaveButton variant={isSuccess ? 'success' : 'primary'} className="mt-6" title={isSubmitting ? 'Saving' : isSuccess ? 'Saved' : 'Save'} />
        </form>
      </Form>
    </Panel>
  )
}

export { ProfileNameForm }
