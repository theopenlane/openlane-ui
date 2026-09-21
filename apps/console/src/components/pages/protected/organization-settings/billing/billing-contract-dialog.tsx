'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganization } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { type PlaceAddress } from '@/hooks/usePlacesAutocomplete'
import { AddressAutocompleteInput } from '@/components/shared/address-autocomplete-input/address-autocomplete-input'

const emptyAddress: PlaceAddress = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
}

const BillingContactDialog = () => {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const { data: setting } = useGetOrganizationSetting(currentOrgId)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { successNotification, errorNotification } = useNotification()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState<PlaceAddress>(emptyAddress)

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setAddress((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateOrg({
        updateOrganizationId: currentOrgId ?? '',
        input: {
          updateOrgSettings: {
            billingAddress: address,
            billingContact: fullName,
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })
      successNotification({
        title: `Successfully saved your billing address!`,
      })
      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  useEffect(() => {
    if (!setting) {
      return
    }
    setAddress({ ...emptyAddress, ...setting.organization.setting?.billingAddress })

    setFullName(setting.organization.setting?.billingContact || '')
    return () => {}
  }, [setting])

  return (
    <Dialog open={open} onOpenChange={setOpen} aria-describedby={undefined}>
      <DialogTrigger asChild>
        <h1 className="text-primary text-sm font-medium cursor-pointer">Edit</h1>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[455px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Billing Address</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="relative">
            <Label htmlFor="line1">Address Line 1</Label>
            <AddressAutocompleteInput
              id="line1"
              value={address.line1}
              onChange={(line1) => setAddress((prev) => ({ ...prev, line1 }))}
              onAddressResolved={setAddress}
              onResolveError={() =>
                errorNotification({
                  title: 'Error',
                  description: 'Could not load the details for the selected address, please fill it in manually.',
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="line2">Address Line 2</Label>
            <Input id="line2" value={address.line2} onChange={handleAddressChange} placeholder="Apt., suite, unit number, etc." />
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={address.country} onChange={handleAddressChange} placeholder="Country" />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={address.city} onChange={handleAddressChange} placeholder="City" />
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" value={address.state} onChange={handleAddressChange} placeholder="State" />
          </div>

          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input id="postalCode" value={address.postalCode} onChange={handleAddressChange} className="max-w-[150px]" />
          </div>

          <DialogFooter>
            <SaveButton className="w-full" isSaving={isPending} disabled={isPending} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BillingContactDialog
