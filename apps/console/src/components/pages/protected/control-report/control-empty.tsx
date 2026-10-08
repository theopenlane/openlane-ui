import { Button } from '@repo/ui/button'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { LayersIcon, LibraryIcon, SquarePenIcon, UploadIcon } from 'lucide-react'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { controlsFromStandardsImportRoute, IMPORT_ROUTES } from '@/components/shared/record-import/lib/import-routes'
import { useOpenImport } from '@/components/shared/record-import/lib/use-open-import'
import Link from 'next/link'

export const ControlsEmptyActions = () => {
  const openImport = useOpenImport()
  const cards = [
    {
      id: 'import-standards',
      title: 'Import from Standards Catalog',
      desc: 'Quickly populate your library with vetted controls from SOC 2, ISO 27001, NIST 800-53, and more from our standards catalog',
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
      desc: 'Begin with an empty control and customize everything — from the control’s description to how it connects with your compliance program and other controls',
      Icon: SquarePenIcon,
      action: {
        label: 'Create',
        href: 'controls/create-control',
      },
    },
    {
      id: 'import-custom',
      title: 'Import Custom Controls',
      desc: 'Upload a CSV with your control ref codes, descriptions, status and more to bulk-create controls',
      Icon: UploadIcon,
      importRoute: IMPORT_ROUTES[ObjectTypes.CONTROL],
    },
    {
      id: 'import-specific',
      title: 'Import Standard Controls',
      desc: 'Import existing controls based on a specific compliance standard to ensure you stay up to date with any changes made to that standard over time',
      Icon: LayersIcon,
      importRoute: controlsFromStandardsImportRoute,
    },
  ]

  return (
    <section aria-label="Create controls" className="mx-auto max-w-5xl ">
      <div className="grid gap-4 sm:grid-cols-2 ">
        {cards.map(({ id, title, desc, Icon, action, importRoute, featured }) => (
          <Card key={id} className={`flex flex-col h-full p-5 ${featured ? 'border-[var(--color-success)]/40 bg-[var(--color-info)]/5' : ''}`}>
            <div className="flex items-center gap-3 mb-3">
              <Icon className={`h-6 w-6 ${featured ? 'text-[var(--color-success)]' : 'text-muted-foreground'}`} />
              <CardTitle className="text-base font-semibold pl-0">{title}</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground flex-1 px-0">{desc}</CardDescription>
            <div className="flex justify-end mt-4">
              {importRoute ? (
                <Button variant="secondary" onClick={() => openImport(importRoute)}>
                  Upload
                </Button>
              ) : (
                <Button asChild variant={featured ? 'secondary' : 'primary'}>
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
