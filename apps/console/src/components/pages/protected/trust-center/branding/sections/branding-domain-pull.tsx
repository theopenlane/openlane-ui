'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Wand } from 'lucide-react'
import { type BrandFormValues } from '../brand-schema'
import SectionWarning from '../section-warning'
import { useBrandingDomainOptions } from '../helpers/use-branding-domain-options'
import { usePullBrandingFromDomain } from '../helpers/use-pull-branding-from-domain'

const DOMAIN_SELECT_ID = 'branding-domain-pull-domain'

interface BrandingDomainPullProps {
  isReadOnly: boolean
  onPulled: () => void
}

export const BrandingDomainPull = ({ isReadOnly, onPulled }: BrandingDomainPullProps) => {
  const [open, setOpen] = useState(false)
  const [pickedDomain, setPickedDomain] = useState('')

  const { formState } = useFormContext<BrandFormValues>()
  const { domainOptions, isLoading } = useBrandingDomainOptions(open)
  const { isPulling, pullBrandingFromDomain } = usePullBrandingFromDomain(onPulled)

  const selectedDomain = domainOptions.includes(pickedDomain) ? pickedDomain : (domainOptions[0] ?? '')

  const handlePull = async () => {
    if (!selectedDomain) return
    const started = await pullBrandingFromDomain(selectedDomain)
    if (started) {
      setOpen(false)
    }
  }

  if (isReadOnly) return null

  return (
    <>
      <Button type="button" variant="secondary" icon={<Wand size={16} />} loading={isPulling} disabled={isPulling} onClick={() => setOpen(true)}>
        {isPulling ? 'Pulling branding' : 'Pull from domain'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pull branding from domain</DialogTitle>
            <DialogDescription>
              We read your website and copy the colors, font, logo and favicon we find into your preview settings. Assets you uploaded yourself are kept, and nothing goes live until you publish.
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading domains…</p>
          ) : domainOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No company domain is configured for this organization yet. Add one under Company Info above, save it, then try again.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={DOMAIN_SELECT_ID} className="text-sm">
                  Domain
                </Label>
                <Select value={selectedDomain} onValueChange={setPickedDomain}>
                  <SelectTrigger id={DOMAIN_SELECT_ID}>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formState.isDirty && <SectionWarning className="mb-0" message="You have unsaved edits on this page. They will be replaced by the branding we pull." />}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" disabled={!selectedDomain || isPulling} loading={isPulling} onClick={handlePull}>
              Pull branding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
