import { Button } from '@repo/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Label } from '@repo/ui/label'
import React from 'react'

const BillingContactDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <h1 className="text-brand text-lg font-medium cursor-pointer">Edit</h1>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[455px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Billing Contact</DialogTitle>
        </DialogHeader>

        <form className="space-y-4">
          <div>
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" placeholder="Email" />
          </div>

          <div>
            <Label htmlFor="country">Country or region</Label>
            <Select>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address-line-1">Address line 1</Label>
            <Input id="address-line-1" />
          </div>

          <div>
            <Label htmlFor="address-line-2">Address line 2</Label>
            <Input id="address-line-2" placeholder="Apt., suite, unit number, etc. (optional)" />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Select>
              <SelectTrigger id="city">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-york">New York</SelectItem>
                <SelectItem value="los-angeles">Los Angeles</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="province">Province</Label>
            <Select>
              <SelectTrigger id="province">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alberta">Alberta</SelectItem>
                <SelectItem value="ontario">Ontario</SelectItem>
                <SelectItem value="british-columbia">British Columbia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="postal-code">Postal Code</Label>
            <Input id="postal-code" className="max-w-[150px]" />
          </div>
        </form>

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

export default BillingContactDialog
