import { Button } from '@repo/ui/button'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { SquarePenIcon, UploadIcon } from 'lucide-react'
import Link from 'next/link'
import CreatePolicyUploadDialog from '../create/form/create-policy-upload-dialog'

export function PolicyEmptyActions() {
  const cards = [
    {
      id: 'create-manual',
      title: 'Create Custom Policy',
      desc: 'Begin with an empty policy and customize everything — from the policy’s description to how it connects with your compliance program and other policies',
      Icon: SquarePenIcon,
      action: {
        label: 'Create',
        href: 'policies/create',
      },
      featured: true,
    },
    {
      id: 'import-custom',
      title: 'Import Existing Documents',
      desc: 'Already have policies written? Import your existing documents to get them organized in Openlane.',
      Icon: UploadIcon,
      dialog: <CreatePolicyUploadDialog trigger={<Button variant="primary">Upload</Button>} />,
    },
  ]

  return (
    <section aria-label="Create policies" className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4">
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
                <Button variant={featured ? 'secondary' : 'primary'}>
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
