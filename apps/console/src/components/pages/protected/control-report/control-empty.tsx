import { Button } from '@repo/ui/button'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { LayersIcon, LibraryIcon, SquarePenIcon, UploadIcon } from 'lucide-react'
import { BulkCSVCloneControlDialog } from '../controls/bulk-csv-clone-control-dialog'
import { BulkCSVCreateControlDialog } from '../controls/bulk-csv-create-control-dialog'
import Link from 'next/link'
import { cn } from '@repo/ui/lib/utils'
import { buttonVariants } from '@repo/ui/components/ui/button.tsx'

export function ControlsEmptyActions() {
  const cards = [
    {
      id: 'import-standards',
      title: 'Import from Standards Catalog',
      desc: 'Quickly populate your library with vetted controls from SOC 2, ISO 27001, NIST 800-53, and more—no manual entry required.',
      Icon: LibraryIcon,
      action: {
        label: 'Browse Catalog',
        href: '/standards',
      },
      featured: true,
    },
    {
      id: 'create-manual',
      title: 'Create Custom Controls',
      desc: 'Begin with an empty control and customize everything — from the control’s purpose and description to how it connects with your compliance frameworks.',
      Icon: SquarePenIcon,
      action: {
        label: 'Create',
        href: 'controls/create-control',
      },
    },
    {
      id: 'import-custom',
      title: 'Import Custom Controls',
      desc: 'Upload a CSV with your control names, descriptions, frameworks, and mappings to bulk-create controls automatically.',
      Icon: UploadIcon,
      dialog: <BulkCSVCreateControlDialog trigger={<div className={cn(buttonVariants({ variant: 'newSecondary' }))}>Upload</div>} />,
    },
    {
      id: 'import-specific',
      title: 'Import Standard Controls',
      desc: 'Import existing controls based on a specific compliance standard to ensure you stay up to date with any changes.',
      Icon: LayersIcon,
      dialog: <BulkCSVCloneControlDialog trigger={<div className={cn(buttonVariants({ variant: 'newSecondary' }))}>Upload</div>} />,
    },
  ]

  return (
    <section aria-label="Create controls" className="mx-auto max-w-5xl ">
      <div className="grid gap-4 sm:grid-cols-2 ">
        {cards.map(({ id, title, desc, Icon, action, dialog, featured }) => (
          <Card key={id} className={`flex flex-col h-full p-5 ${featured ? 'border-[var(--color-success)]/40 bg-[var(--color-info)]/5' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <Icon className={`h-6 w-6 ${featured ? 'text-[var(--color-success)]' : 'text-muted-foreground'}`} />
              <CardTitle className="text-base font-semibold pl-0">{title}</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground flex-1 px-0">{desc}</CardDescription>
            <div className="flex justify-end mt-4">
              {dialog ? (
                dialog
              ) : (
                <Button className={featured ? 'btn-secondary' : ''}>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
