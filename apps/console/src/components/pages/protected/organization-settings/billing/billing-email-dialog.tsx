import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import React, { useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationSetting, useUpdateOrganization } from '@/lib/graphql-hooks/organization'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

const BillingEmailDialog = () => {
  const queryClient = useQueryClient()
  const { currentOrgId } = useOrganization()
  const [emailInput, setEmailInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { isPending, mutateAsync: updateOrg } = useUpdateOrganization()
  const { successNotification, errorNotification } = useNotification()

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
      queryClient.invalidateQueries({ queryKey: ['organizationSetting', currentOrgId] })

      successNotification({
        title: `${emailInput} was successfully added as Billing Alert`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <h1 className="text-brand text-sm font-medium cursor-pointer" onClick={() => setIsOpen(true)}>
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
