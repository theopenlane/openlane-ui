'use client'

import { GetUserProfileQueryVariables, useGetUserProfileQuery, useUpdateUserMutation, useUpdateUserSettingMutation } from '@repo/codegen/src/schema'
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
import { toast } from '@repo/ui/use-toast'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon } from 'lucide-react'

const ProfileNameForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const [{ fetching: isSubmitting }, updateUserName] = useUpdateUserMutation()

  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const variables: GetUserProfileQueryVariables = {
    userId: userId ?? '',
  }

  const [{ data: userData }] = useGetUserProfileQuery({ variables })

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
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: userData?.user.firstName || '',
      lastName: userData?.user.lastName || '',
      displayName: userData?.user.displayName || '',
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
        },
      })
      setIsSuccess(true)
      toast({ title: 'Profile updated successfully!', variant: 'success' })
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'An error occurred while updating your profile.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    if (userData) {
      form.reset({
        firstName: userData.user.firstName ?? '',
        lastName: userData.user.lastName ?? '',
        displayName: userData?.user.displayName ?? '',
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
    <Panel>
      <PanelHeader heading="Your Profile" noBorder />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <InputRow>
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <InfoIcon size={14} className="mx-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Your official name as recognized on legal documents like IDs, tax forms, or contracts.</p>
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
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <InfoIcon size={14} className="mx-1" />
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
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <TooltipProvider disableHoverableContent={true}>
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <InfoIcon size={14} className="mx-1" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Your official name as recognized on legal documents like IDs, tax forms, or contracts.</p>
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
            <Button variant={isSuccess ? 'success' : 'filled'} type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Saving' : isSuccess ? 'Saved' : 'Save'}
            </Button>
          </InputRow>
        </form>
      </Form>
    </Panel>
  )
}

export { ProfileNameForm }
