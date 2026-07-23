'use client'

import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardDescription, CardTitle } from '@repo/ui/cardpanel'
import { FileTextIcon, LinkIcon, LoaderCircle, SquarePenIcon, UploadIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import CreatePolicyUploadDialog from '../create/form/create-policy-upload-dialog'
import { INTEGRATIONS_DOCUMENT_FILTER_URL } from '@/constants'
import { PolicyTemplateBrowser } from '@/components/shared/github-selector/policy-selector'
import { type TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import { useCreateUploadInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

export const PolicyEmptyActions = () => {
  const router = useRouter()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadPolicy } = useCreateUploadInternalPolicy()
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false)
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false)

  const handleTemplateFileSelect = async (file: TUploadedFile) => {
    setIsCreatingFromTemplate(true)
    try {
      const result = await createUploadPolicy({ internalPolicyFile: file.file })
      const policyId = result.createUploadInternalPolicy.internalPolicy.id

      successNotification({
        title: 'Policy Created',
        description: 'Policy has been successfully created from template',
      })

      router.push(`/policies/${policyId}/view`)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })

      setIsCreatingFromTemplate(false)
    }
  }

  const cards = [
    {
      id: 'create-manual',
      title: 'Create Custom Policy',
      desc: 'Begin with an empty policy and customize everything — from the policy’s description to how it connects with your compliance program and other policies',
      Icon: SquarePenIcon,
      iconClassName: 'text-[var(--color-success)]',
      cardClassName: 'border-[var(--color-success)]/40 bg-[var(--color-success)]/5',
      action: {
        label: 'Create',
        href: 'policies/create',
      },
      buttonVariant: 'primary' as const,
      buttonClassName: '!bg-[var(--color-success)] hover:opacity-90',
    },
    {
      id: 'policy-hub',
      title: 'Import from Policy Hub',
      desc: 'Start from a library of pre-written policy templates and customize it to fit your organization.',
      Icon: FileTextIcon,
      iconClassName: 'text-blue-400',
      cardClassName: 'border-blue-500/30 bg-blue-500/5',
      dialog: (
        <Button variant="primary" onClick={() => setShowTemplateBrowser(true)} disabled={isCreatingFromTemplate}>
          Browse Templates
        </Button>
      ),
    },
    {
      id: 'managed-via-integration',
      title: 'Managed via Integration',
      badge: (
        <Badge variant="outline" className="ml-2 border-purple-500/40 bg-purple-500/15 text-purple-300">
          New
        </Badge>
      ),
      desc: 'Manage your policy in an integrated platform like Google Drive. Changes stay in the source system and are automatically reflected in Openlane.',
      Icon: LinkIcon,
      iconClassName: 'text-purple-400',
      cardClassName: 'border-purple-500/30 bg-purple-500/5',
      action: {
        label: 'Manage',
        href: INTEGRATIONS_DOCUMENT_FILTER_URL,
      },
      buttonVariant: 'primary' as const,
      buttonClassName: '!bg-purple-600 hover:!bg-purple-500 !text-white',
    },
    {
      id: 'import-custom',
      title: 'Import Existing Documents',
      desc: 'Already have policies written? Import your existing documents to get them organized in Openlane.',
      Icon: UploadIcon,
      iconClassName: 'text-primary',
      dialog: <CreatePolicyUploadDialog trigger={<Button variant="primary">Upload</Button>} />,
    },
  ]

  return (
    <section aria-label="Create policies" className="w-full">
      <div className="flex flex-col gap-4">
        {cards.map(({ id, title, badge, desc, Icon, iconClassName, cardClassName, action, buttonVariant, buttonClassName, dialog }) => (
          <Card key={id} className={`flex flex-col h-full p-6 ${cardClassName ?? ''}`}>
            <div className="flex flex-1 items-start gap-3">
              <Icon className={`h-6 w-6 shrink-0 ${iconClassName}`} />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <CardTitle className="text-base font-semibold p-0">{title}</CardTitle>
                  {badge}
                </div>
                <CardDescription className="text-sm text-muted-foreground p-0">{desc}</CardDescription>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              {dialog ? (
                dialog
              ) : (
                <Button variant={buttonVariant} className={buttonClassName}>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <PolicyTemplateBrowser isOpen={showTemplateBrowser} onClose={() => setShowTemplateBrowser(false)} onFileSelect={handleTemplateFileSelect} />

      {isCreatingFromTemplate &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-90">
            <div className="bg-secondary rounded-xl border p-8 flex flex-col items-center gap-4">
              <LoaderCircle className="animate-spin opacity-30" size={32} />
              <p className="text-lg">Creating policy from template...</p>
            </div>
          </div>,
          document.body,
        )}
    </section>
  )
}
