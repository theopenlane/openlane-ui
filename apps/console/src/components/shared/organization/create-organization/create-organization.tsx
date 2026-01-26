'use client'

import { createOrganizationStyles } from './create-organization.styles'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { useNotification } from '@/hooks/useNotification'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { Form, FormItem, FormLabel, FormField, FormControl, FormMessage } from '@repo/ui/form'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { InfoIcon } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { useCreateOrganization } from '@/lib/graphql-hooks/organization'
import { switchOrganization, handleSSORedirect } from '@/lib/user'
import { useQueryClient } from '@tanstack/react-query'
import { ClientError } from 'graphql-request'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

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
  const { errorNotification } = useNotification()
  const { data: session, update } = useSession()
  const { allOrgs } = useOrganization()
  const numOrgs = allOrgs.length
  const { isPending, mutateAsync: createOrg } = useCreateOrganization()

  const { container } = createOrganizationStyles()
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      displayName: '',
    },
  })

  const { setValue } = form

  const createOrganization = async ({ name, displayName }: { name: string; displayName?: string }) => {
    try {
      const response = await createOrg({
        input: {
          name: name,
          displayName: displayName,
        },
      })

      if (response.extensions && session) {
        const switchResponse = await switchOrganization({
          target_organization_id: response.data.createOrganization.organization.id,
        })

        if (handleSSORedirect(switchResponse)) {
          return
        }

        if (switchResponse) {
          await update({
            ...switchResponse.session,
            user: {
              ...session.user,
              accessToken: switchResponse.access_token,
              organization: response.data.createOrganization.organization.id,
              refreshToken: switchResponse.refresh_token,
              isOnboarding: false,
            },
          })
        }
      }

      if (response.data) {
        requestAnimationFrame(() => {
          queryClient?.invalidateQueries()
        })
        push('/dashboard')
      }
    } catch (error: unknown) {
      let errorMessage: string | undefined
      if (error instanceof ClientError) {
        errorMessage = parseErrorMessage(error.response.errors)
      }
      errorNotification({
        title: errorMessage ?? 'Failed to create organization. Please try again.',
      })
    }
  }

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createOrganization({ name: data.name, displayName: data.displayName })
  }

  return (
    <div className={container()}>
      <Panel>
        <PanelHeader
          heading={numOrgs === 1 ? 'Create your first organization' : 'Create another organization'}
          subheading={numOrgs === 1 ? 'To get started create a organization for your business or department.' : null}
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="bg-transparent">
                          <InfoIcon size={14} className="mx-1" />
                        </TooltipTrigger>
                        <TooltipContent side="right">Name must be unique, with a maximum length of 32 characters</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} onChangeCapture={(e) => setValue('displayName', (e.target as HTMLInputElement).value)} />
                  </FormControl>
                  <FormMessage reserveSpace={false} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Display name
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="bg-transparent">
                          <InfoIcon size={14} className="mx-1" />
                        </TooltipTrigger>
                        <TooltipContent side="right">Non-unique user-friendly name for the organization; usually the same as the name</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage reserveSpace={false} />
                </FormItem>
              )}
            />
            <Button type="submit">{isPending ? 'Creating organization' : 'Create organization'}</Button>
          </form>
        </Form>
      </Panel>
    </div>
  )
}
