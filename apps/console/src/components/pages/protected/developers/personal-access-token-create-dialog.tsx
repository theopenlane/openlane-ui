'use client'

import React, { useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { CirclePlusIcon, CopyIcon } from 'lucide-react'
import { toast } from '@repo/ui/use-toast'
import { useCreatePersonalAccessTokenMutation, useGetPersonalAccessTokensQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { useOrganization } from '@/hooks/useOrganization'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { useForm } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const formSchema = z
  .object({
    name: z.string().min(3, { message: 'Token name is required' }),
    description: z.string().optional(),
    organizationIDs: z.array(z.string()).nonempty({ message: 'At least one organization must be selected' }),
    expiryDate: z.date().optional(),
    noExpire: z.boolean().optional(),
  })
  .refine((data) => data.expiryDate || data.noExpire, {
    message: 'Please specify an expiry date or select the Never expires checkbox',
    path: ['expiryDate'],
  })

type FormData = zInfer<typeof formSchema>

type PersonalApiKeyDialogProps = {
  triggerText?: boolean
}

enum STEP {
  CREATE = 'CREATE',
  CREATED = 'CREATED',
}

const PersonalApiKeyDialog = ({ triggerText }: PersonalApiKeyDialogProps) => {
  const { data: sessionData } = useSession()
  const { allOrgs: orgs } = useOrganization()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, createToken] = useCreatePersonalAccessTokenMutation()
  const [step, setStep] = useState<STEP>(STEP.CREATE)

  const [confirmationChecked, setConfirmationChecked] = useState<boolean>(false)
  const [token, setToken] = useState<string>('')

  const [{ data, fetching, error }, refetch] = useGetPersonalAccessTokensQuery({ requestPolicy: 'network-only' })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      expiryDate: undefined,
      organizationIDs: [],
      noExpire: false,
    },
  })

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token)
    toast({
      title: 'Token copied!',
      variant: 'success',
    })
  }

  const handleSubmit = async (values: FormData) => {
    try {
      setIsSubmitting(true)
      const response = await createToken({
        input: {
          name: values.name,
          description: values.description,
          expiresAt: values.noExpire ? null : values.expiryDate,
          ownerID: sessionData?.user.userId,
          organizationIDs: values.organizationIDs || [],
        },
      })

      const createdToken = response.data?.createPersonalAccessToken.personalAccessToken.token

      if (response.data && createdToken) {
        setToken(createdToken)
        toast({
          title: 'Token created successfully!',
          description: 'Copy your access token now, as you will not be able to see it again.',
          variant: 'success',
        })

        setStep(STEP.CREATED)
        refetch()
        console.log('Generated Token:', createdToken) // Show this in a modal/dialog if needed
      } else {
        throw new Error('Failed to create token')
      }
    } catch (error) {
      toast({
        title: 'Error creating API Key!',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open === false) {
          setTimeout(() => {
            setStep(STEP.CREATE)
          }, 300)
        }
      }}
    >
      <DialogTrigger asChild>
        {triggerText ? (
          <div className="flex cursor-pointer">
            <p className="text-brand ">Create token</p>
            <p>?</p>
          </div>
        ) : (
          <Button iconPosition="left" icon={<CirclePlusIcon />}>
            Create Token
          </Button>
        )}
      </DialogTrigger>
      {step === STEP.CREATE ? (
        <DialogContent className="sm:max-w-[455px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Create new token</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter token name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a description (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="organizationIDs"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authorized organization(s)</FormLabel>
                    <FormControl>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outlineInput" full>
                            {field.value && field.value.length > 0
                              ? Object.entries(orgs)
                                  .filter(([key, value]) => field?.value?.includes(value?.node?.id ?? ''))
                                  .map(([key, value]) => value?.node?.name)
                                  .join(', ')
                              : 'Select organization(s)'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {Object.entries(orgs).map(([key, value]) => {
                            const image = value?.node?.avatarFile?.presignedURL ?? value?.node?.avatarRemoteURL
                            return (
                              <DropdownMenuCheckboxItem
                                key={value?.node?.id}
                                checked={field?.value?.includes(value?.node?.id ?? '')}
                                onCheckedChange={(checked) => {
                                  const newValue = checked ? [...(field?.value ?? []), value?.node?.id!] : field?.value?.filter((id) => id !== value?.node?.id)
                                  field.onChange(newValue)
                                }}
                              >
                                <Avatar variant="medium">
                                  {image && <AvatarImage src={image} />}
                                  <AvatarFallback>{value?.node?.name?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                {value?.node?.name}
                              </DropdownMenuCheckboxItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="expiryDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration*</FormLabel>
                    {!form.watch('noExpire') && (
                      <>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={form.watch('noExpire')}
                            value={field.value ? field.value.toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                name="noExpire"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center mt-2">
                      <Checkbox id="no-expire" checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                      <Label htmlFor="no-expire" className="ml-2 font-medium">
                        Never expires
                      </Label>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button className="w-full mt-4" type="submit" variant="filled" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Token'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-[455px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Token created</DialogTitle>
            <p className="mt-2">Copy your access token now, as you will not be able to see this again</p>
          </DialogHeader>
          <div onClick={handleCopyToken} className=" flex items-center justify-between w-full cursor-pointer">
            <Input className="bg-background" icon={<CopyIcon />} readOnly value={token} maxWidth />
          </div>
          <div className="flex items-center mt-4">
            <Checkbox id="confirmation" onCheckedChange={(checked: boolean) => setConfirmationChecked(checked)} />
            <Label htmlFor="confirmation" className="  ml-4 w-full text-sm">
              I have copied the access token and put it in a safe place
            </Label>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

export default PersonalApiKeyDialog
