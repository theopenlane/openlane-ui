import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSettingQuery, useUpdateOrganizationMutation } from '@repo/codegen/src/schema'
import { useToast } from '@repo/ui/use-toast'

const BillingEmailDialog = () => {
  const { currentOrgId } = useOrganization()
  const [emailInput, setEmailInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [{ fetching: isSubmitting }, updateOrg] = useUpdateOrganizationMutation()
  const { toast } = useToast()

  const [settingData] = useGetOrganizationSettingQuery({ pause: !currentOrgId, variables: { organizationId: currentOrgId } })

  useEffect(() => {
    if (isOpen) {
      setEmailInput(settingData.data?.organization.setting?.billingEmail || '')
    }
  }, [settingData, isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const resp = await updateOrg({
      updateOrganizationId: currentOrgId,
      input: {
        updateOrgSettings: { billingEmail: emailInput },
      },
    })

    if (resp.error) {
      toast({
        title: `Something went wrong with saving your address!`,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: `${emailInput} was successfully added as Billing Alert`,
      variant: 'success',
    })
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <h1 className="text-brand text-lg font-medium cursor-pointer" onClick={() => setIsOpen(true)}>
          Edit
        </h1>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Billing Email</DialogTitle>
        </DialogHeader>

        {/* Form starts here */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-billing-email">Billing email:</Label>
            <Input id="new-billing-email" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} type="email" required />
          </div>

          <DialogFooter>
            <Button className="w-full mt-4" variant="filled" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
        {/* Form ends here */}
      </DialogContent>
    </Dialog>
  )
}

export default BillingEmailDialog
