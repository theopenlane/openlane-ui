import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useToast } from '@repo/ui/use-toast'
import { useGetOrganizationSetting, useUpdateOrganization } from '@/lib/graphql-hooks/organization'

const BillingEmailDialog = () => {
  const { currentOrgId } = useOrganization()
  const [emailInput, setEmailInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { toast } = useToast()

  const { data: settingData } = useGetOrganizationSetting(currentOrgId)

  useEffect(() => {
    if (isOpen) {
      setEmailInput(settingData?.organization.setting?.billingEmail || '')
    }
  }, [settingData, isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      await updateOrg({
        updateOrganizationId: currentOrgId!,
        input: {
          updateOrgSettings: { billingEmail: emailInput },
        },
      })

      toast({
        title: `${emailInput} was successfully added as Billing Alert`,
        variant: 'success',
      })
      setIsOpen(false)
    } catch {
      toast({
        title: `Something went wrong with saving your email!`,
        variant: 'destructive',
      })
    }
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
            <Button className="w-full mt-4" variant="filled" type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
        {/* Form ends here */}
      </DialogContent>
    </Dialog>
  )
}

export default BillingEmailDialog
