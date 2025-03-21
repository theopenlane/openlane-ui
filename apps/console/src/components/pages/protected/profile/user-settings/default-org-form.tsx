'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { Button } from '@repo/ui/button'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@repo/ui/select'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useGetCurrentUser, useUpdateUserSetting } from '@/lib/graphql-hooks/user'
import { useGetAllOrganizations } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'

const DefaultOrgForm = () => {
  const [isSuccess, setIsSuccess] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const { data: userData } = useGetCurrentUser(userId)
  const { data: orgsData } = useGetAllOrganizations()
  const allOrgs = orgsData?.organizations?.edges?.filter((org) => !org?.node?.personalOrg) || []

  const { isPending: isSubmitting, mutateAsync: updateUserSetting } = useUpdateUserSetting()

  const formSchema = z.object({
    defaultOrg: z.string().min(1, {
      message: 'Default organization cannot be empty',
    }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const updateDefaultOrg = async (defaultOrg: string) => {
    try {
      await updateUserSetting({
        updateUserSettingId: userData?.user?.setting?.id ?? '',
        input: {
          defaultOrgID: defaultOrg,
        },
      })
      setIsSuccess(true)
      successNotification({ title: 'Default organization updated successfully!' })
    } catch (error) {
      console.error('Failed to update default organization:', error)
      errorNotification({ title: 'An error occurred while updating the default organization.', variant: 'destructive' })
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (data.defaultOrg !== userData?.user.setting?.defaultOrg?.id) {
      await updateDefaultOrg(data.defaultOrg)
    }
  }

  useEffect(() => {
    if (userData) {
      form.reset({
        defaultOrg: userData.user.setting?.defaultOrg?.id ?? '',
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
      <PanelHeader heading="Default Organization" noBorder />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="defaultOrg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Organization</FormLabel>
                <div className="flex items-center w-80 gap-4">
                  <FormControl>
                    <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={userData?.user?.setting?.defaultOrg?.displayName} />
                      </SelectTrigger>
                      <SelectContent>
                        {allOrgs.map((org) => (
                          <SelectItem key={org?.node?.id} value={org?.node?.id || ''}>
                            {org?.node?.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <Button type="submit" loading={isSubmitting}>
                    {isSubmitting ? 'Saving' : isSuccess ? 'Saved' : 'Save'}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Panel>
  )
}

export default DefaultOrgForm
