'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { type EntityQuery } from '@repo/codegen/src/schema'
import { Callout } from '@/components/shared/callout/callout'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { useVendorSubprocessorMatch } from '@/lib/graphql-hooks/subprocessor'
import { AddToTrustCenterForm } from './add-to-trust-center-form'
import { vendorSubprocessorName } from './vendor-subprocessor'

const SUBPROCESSORS_HREF = '/trust-center/subprocessors'

type TVendor = EntityQuery['entity']

type TAddToTrustCenterDialogProps = {
  vendor: TVendor
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AddToTrustCenterDialog = ({ vendor, open, onOpenChange }: TAddToTrustCenterDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>Add to Trust Center</DialogTitle>
        <DialogDescription>List this vendor as a subprocessor on your Trust Center.</DialogDescription>
      </DialogHeader>
      <AddToTrustCenterBody vendor={vendor} onClose={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
)

const Notice = ({ variant, message, onClose, showSubprocessorsLink }: { variant: 'info' | 'warning'; message: string; onClose: () => void; showSubprocessorsLink?: boolean }) => (
  <>
    <Callout variant={variant}>{message}</Callout>
    <DialogFooter className="gap-2">
      <Button type="button" variant="secondary" onClick={onClose}>
        Close
      </Button>
      {showSubprocessorsLink && (
        <Button asChild>
          <Link href={SUBPROCESSORS_HREF}>View Subprocessors</Link>
        </Button>
      )}
    </DialogFooter>
  </>
)

const AddToTrustCenterBody = ({ vendor, onClose }: { vendor: TVendor; onClose: () => void }) => {
  const { data, isPending, isError } = useVendorSubprocessorMatch({ entityId: vendor.id, name: vendorSubprocessorName(vendor) })

  if (isError) {
    return <Notice variant="warning" message="We could not check your Trust Center. Please try again later." onClose={onClose} />
  }

  if (isPending) {
    return <StatusLine>Checking your Trust Center...</StatusLine>
  }

  const { trustCenter, listedSubprocessor, subprocessor } = data

  if (!trustCenter) {
    return <Notice variant="info" message="Your organization does not have a Trust Center yet. Set one up before adding subprocessors to it." onClose={onClose} />
  }

  if (trustCenter.subprocessorURL) {
    return (
      <Notice
        variant="info"
        message="Your Trust Center links to an external subprocessor list. Switch it to managing subprocessors in Openlane before adding vendors."
        onClose={onClose}
        showSubprocessorsLink
      />
    )
  }

  if (listedSubprocessor) {
    return <Notice variant="info" message={`${listedSubprocessor.name} is already listed as a subprocessor on your Trust Center.`} onClose={onClose} showSubprocessorsLink />
  }

  return <AddToTrustCenterForm vendor={vendor} existingSubprocessor={subprocessor} onCancel={onClose} onAdded={onClose} />
}
