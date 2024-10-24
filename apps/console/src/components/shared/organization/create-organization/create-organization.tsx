'use client'

import { createOrganizationStyles } from './create-organization.styles'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useToast } from '@repo/ui/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
} from '@repo/ui/form'
import { Info } from '@repo/ui/info'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import {
  useCreateOrganizationMutation,
  useGetAllOrganizationsQuery,
} from '@repo/codegen/src/schema'
import { useGqlError } from '@/hooks/useGqlError'
import { useEffect } from 'react'

const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Name must be at least 2 characters',
    })
    .max(32, {
      message: 'Please use 32 characters at maximum.',
    }),
  displayName: z.string().min(2, {
    message: 'Display name must be at least 2 characters',
  }),
})

export const CreateOrganizationForm = () => {
  const { push } = useRouter()
  const { toast } = useToast()
  const { data: session, update } = useSession()
  const [allOrgs] = useGetAllOrganizationsQuery()
  const numOrgs = allOrgs.data?.organizations?.edges?.length ?? 0
  const [result, addOrganization] = useCreateOrganizationMutation()
  const { error, fetching } = result
  const { errorMessages } = useGqlError(error)

  const isLoading = fetching
  const { container } = createOrganizationStyles()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
    },
  })

  const createOrganization = async ({
    name,
    displayName,
  }: {
    name: string
    displayName?: string
  }) => {
    try {
      const response = await addOrganization({
        input: {
          name: name,
          displayName: displayName,
        },
      })

      if (response.extensions && session) {
        await update({
          ...session,
          user: {
            ...session.user,
            accessToken: response.extensions.auth.access_token,
            organization: response.extensions.auth.authorized_organization,
            refreshToken: response.extensions.auth.refresh_token,
          },
        })
      }

      response.data && push('/dashboard')
    } catch (error) {
      console.error('Error creating organization:', error)
      toast({
        title: 'Failed to create organization. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createOrganization({ name: data.name, displayName: data.displayName })
  }

  useEffect(() => {
    if (errorMessages.length > 0) {
      toast({
        title: errorMessages.join('\n'),
        variant: 'destructive',
      })
    }
  }, [errorMessages])

  return (
    <div className={container()}>
      <Panel>
        <PanelHeader
          heading={
            numOrgs === 0 ? 'Create your first organization' : 'Create a organization'
          }
          subheading={
            numOrgs === 0
              ? 'To get started create a organization for your business or department.'
              : null
          }
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <Info>Please use 32 characters at maximum.</Info>
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
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              {isLoading ? 'Creating organization' : 'Create organization'}
            </Button>
          </form>
        </Form>
      </Panel>
    </div>
  )
}
