import { Button } from '@repo/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import React from 'react'

const BillingEmailDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <h1 className="text-brand text-lg font-medium cursor-pointer">Edit</h1>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Billing Email</DialogTitle>
        </DialogHeader>

        {/* Choose Email Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="billing-email">Choose email</Label>
          <Select>
            <SelectTrigger id="billing-email">
              <SelectValue placeholder="sfunk@theopenlane.io" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sfunk@theopenlane.io">sfunk@theopenlane.io</SelectItem>
              <SelectItem value="sfunk-alt@theopenlane.io">sfunk-alt@theopenlane.io</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Link */}
        <p className="text-sm text-gray-600">
          These emails were added on your <span className="text-brand cursor-pointer underline">profile</span>
        </p>

        {/* Add New Email */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="new-billing-email">or, add new email for Billing</Label>
          <Input id="new-billing-email" placeholder="sfunk-billing@theopenlane.io" />
        </div>

        {/* Save Button */}
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full mt-4" variant="filled">
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BillingEmailDialog
