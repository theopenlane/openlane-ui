import React, { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Checkbox } from '@repo/ui/checkbox'
import { PencilIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@repo/ui/form'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@repo/ui/dropdown-menu'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useOrganization } from '@/hooks/useOrganization'
import { Organization } from '@repo/codegen/src/schema'

type PersonalAccessTokenEditProps = {
  tokenDescription?: string
  tokenExpiration: string
  tokenAuthorizedOrganizations?: { id: string; name: string }[]
}

const PersonalAccessTokenEdit: React.FC<PersonalAccessTokenEditProps> = ({ tokenDescription, tokenExpiration, tokenAuthorizedOrganizations }) => {
  const path = usePathname()
  const isOrg = path.includes('/organization-settings')
  const [open, setOpen] = useState(false)
  const { allOrgs: orgs } = useOrganization()

  const formSchema = z
    .object({
      description: z.string().optional(),
      expiryDate: z.date().optional(),
      noExpire: z.boolean().optional(),
      organizationIDs: z.array(z.string()).optional(),
    })
    .refine((data) => data.expiryDate || data.noExpire, { message: 'Please specify an expiry date or select Never expires', path: ['expiryDate'] })
    .refine((data) => isOrg || (data.organizationIDs && data.organizationIDs.length > 0), { message: 'At least one organization must be selected', path: ['organizationIDs'] })

  type FormData = z.infer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: tokenDescription || '',
      expiryDate: tokenExpiration ? new Date(tokenExpiration) : undefined,
      noExpire: false,
      organizationIDs: tokenAuthorizedOrganizations?.map((org) => org.id) || [],
    },
  })

  const formatDateToLocal = (date?: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = (data: FormData) => {
    console.log('Form submitted:', data)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="!bg-transparent !hover:bg-transparent !text-inherit flex items-center justify-center p-2">
          <PencilIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--foreground))]">Edit Personal Access Token</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form id="edit-token-form" className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="space-y-4 py-4">
              <div>
                <FormField
                  name="description"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token description</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My API Token" className="mt-1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  name="expiryDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token expiration</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={formatDateToLocal(field.value)}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                          disabled={form.watch('noExpire')}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  name="noExpire"
                  control={form.control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={field.value || false} onCheckedChange={field.onChange} />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Never expires</span>
                    </div>
                  )}
                />
              </div>
              {!isOrg && (
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
                                    .filter(([, value]) => value?.node && field.value?.includes(value.node.id))
                                    .map(([, value]) => value!.node!.name)
                                    .join(', ')
                                : 'Select organization(s)'}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {Object.entries(orgs).map(([, value]) => {
                              const orgNode = value?.node
                              if (!orgNode) return null
                              return (
                                <DropdownMenuCheckboxItem
                                  key={orgNode.id}
                                  checked={field.value?.includes(orgNode.id) ?? false}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value ?? []
                                    const newValue = checked ? [...currentValue, orgNode.id] : currentValue.filter((id) => id !== orgNode.id)
                                    field.onChange(newValue)
                                  }}
                                >
                                  <Avatar entity={orgNode as Organization} variant="small" />
                                  {orgNode.name}
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
              )}
            </div>
          </form>
        </FormProvider>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="text-[hsl(var(--muted-foreground))]">
            Cancel
          </Button>
          <Button type="submit" form="edit-token-form" className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PersonalAccessTokenEdit
