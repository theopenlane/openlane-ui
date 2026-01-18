'use client'
import { Input, InputRow } from '@repo/ui/input'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormItem, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { RESET_SUCCESS_STATE_MS } from '@/constants'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetBillingEmail, useUpdateOrganization } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { SaveButton } from '@/components/shared/save-button/save-button'

const OrganizationEmailForm = () => {
  const queryClient = useQueryClient()
  const [isSuccess, setIsSuccess] = useState(false)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { currentOrgId } = useOrganization()

  const { data: setting } = useGetBillingEmail(currentOrgId)
  const billingEmail = setting?.organization.setting?.billingEmail
  const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  })

  useEffect(() => {
    if (billingEmail) {
      form.reset({
        email: billingEmail ?? undefined,
      })
    }
  }, [billingEmail, form])

  const updateOrganization = async ({ email }: { email: string }) => {
    if (!currentOrgId) {
      return
    }
    await updateOrg({
      updateOrganizationId: currentOrgId,
      input: {
        updateOrgSettings: {
          billingEmail: email,
        },
      },
    })
    setIsSuccess(true)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await updateOrganization({ email: data.email })
    queryClient.invalidateQueries({ queryKey: ['billingEmail', currentOrgId] })
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
    <Panel>
      <PanelHeader heading="Billing email" noBorder />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <InputRow>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input variant="medium" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SaveButton variant={isSuccess ? 'success' : 'primary'} title={isPending ? 'Saving Changes' : isSuccess ? 'Saved' : 'Save Changes'} />
          </InputRow>
        </form>
      </Form>
    </Panel>
  )
}

export { OrganizationEmailForm }
