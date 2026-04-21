'use client'

import React, { useMemo, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Check, CircleCheckBig, CopyPlus, Eye, FilePen, LoaderCircle, Mail, MoreHorizontal, Pencil, SearchIcon, SquarePlus, Trash2 } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useEmailTemplatesWithFilter, useDeleteEmailTemplate, useUpdateEmailTemplate, useCreateEmailTemplate } from '@/lib/graphql-hooks/email-template'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { formatDate } from '@/utils/date'
import { EmailTemplateTemplateContext } from '@repo/codegen/src/schema'
import { EmailTemplateSheet } from './email-template-sheet'

type StatusFilter = 'all' | 'active' | 'inactive'

export const EmailTemplatesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetTemplateId, setSheetTemplateId] = useState<string | undefined>()
  const [sheetReadOnly, setSheetReadOnly] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: deleteTemplate } = useDeleteEmailTemplate()
  const { mutateAsync: updateTemplate } = useUpdateEmailTemplate()
  const { mutateAsync: createTemplate } = useCreateEmailTemplate()

  const where = useMemo(() => {
    const conditions: Record<string, unknown> = {}
    if (debouncedSearch) {
      conditions.nameContainsFold = debouncedSearch
    }
    if (statusFilter === 'active') {
      conditions.active = true
    } else if (statusFilter === 'inactive') {
      conditions.active = false
    }
    return conditions
  }, [debouncedSearch, statusFilter])

  const { emailTemplatesNodes, isLoading } = useEmailTemplatesWithFilter({ where })

  const userIds = useMemo(() => Array.from(new Set(emailTemplatesNodes.map((t) => t.createdBy).filter((id): id is string => !!id))), [emailTemplatesNodes])

  const { users } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[number]> = {}
    users?.forEach((u) => {
      if (u?.id) map[u.id] = u
    })
    return map
  }, [users])

  const openSheet = (templateId: string | undefined, readOnly: boolean) => {
    setSheetTemplateId(templateId)
    setSheetReadOnly(readOnly)
    setSheetOpen(true)
  }

  const handleCreate = () => openSheet(undefined, false)
  const handleEdit = (id: string) => openSheet(id, false)
  const handlePreview = (id: string) => openSheet(id, true)

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSheetTemplateId(undefined)
    setSheetReadOnly(false)
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await updateTemplate({ updateEmailTemplateId: id, input: { active: !currentActive } })
      successNotification({ title: `Template ${currentActive ? 'disabled' : 'activated'}` })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDuplicate = async (template: (typeof emailTemplatesNodes)[number]) => {
    try {
      const baseKey = template.key ?? template.name.toLowerCase().replace(/\s+/g, '-')
      await createTemplate({
        input: {
          name: `${template.name} (Copy)`,
          key: `${baseKey}-copy-${Date.now()}`,
          description: template.description ?? undefined,
          locale: template.locale ?? 'en',
          format: template.format,
          active: false,
          subjectTemplate: template.subjectTemplate ?? undefined,
          preheaderTemplate: template.preheaderTemplate ?? undefined,
          bodyTemplate: template.bodyTemplate ?? undefined,
          textTemplate: template.textTemplate ?? undefined,
          templateContext: EmailTemplateTemplateContext.CAMPAIGN_RECIPIENT,
        },
      })
      successNotification({ title: 'Template duplicated' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    try {
      await deleteTemplate({ deleteEmailTemplateId: deleteTargetId })
      successNotification({ title: 'Template deleted' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTargetId(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Input
          className="bg-transparent w-[280px]"
          icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search email templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          variant="searchTable"
          iconPosition="left"
        />
        <div className="grow flex flex-row items-center gap-2 justify-end">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="shrink-0">
            <TabsList className="flex-nowrap">
              <TabsTrigger value="all" className="whitespace-nowrap">
                All
              </TabsTrigger>
              <TabsTrigger value="active" className="whitespace-nowrap">
                Active
              </TabsTrigger>
              <TabsTrigger value="inactive" className="whitespace-nowrap">
                Inactive
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left" onClick={handleCreate}>
            Create Email Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="animate-spin text-muted-foreground" size={24} />
        </div>
      ) : emailTemplatesNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Mail size={40} className="mb-3 opacity-50" />
          <p className="text-sm">No email templates found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {emailTemplatesNodes.map((template) => {
            const author = template.createdBy ? userMap[template.createdBy] : undefined
            const authorName = author?.displayName ?? '—'
            const campaignsCount = template.campaigns?.totalCount ?? 0
            return (
              <div key={template.id} className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-colors">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-avatar-transparent">
                  <Mail size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{template.name}</span>
                    {template.active ? (
                      <Badge variant="green" className="shrink-0 gap-1 text-xs">
                        <Check size={12} />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="white" className="shrink-0 gap-1 text-xs">
                        <FilePen size={12} />
                        Draft
                      </Badge>
                    )}
                  </div>
                  {template.subjectTemplate && <p className="text-xs text-muted-foreground truncate">Subject: {template.subjectTemplate}</p>}
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    <span>Created {formatDate(template.createdAt)}</span>
                    <span>·</span>
                    <span>Updated {formatDate(template.updatedAt)}</span>
                    <span>·</span>
                    <span>By {authorName}</span>
                    <span>·</span>
                    <span className="text-primary">
                      Used in {campaignsCount} {campaignsCount === 1 ? 'campaign' : 'campaigns'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="secondary" size="sm" className="px-2 py-2" onClick={() => handleEdit(template.id)} aria-label="Edit template">
                    <Pencil size={14} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm" className="px-2 py-2" aria-label="More actions">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-48 border shadow-md">
                      <DropdownMenuItem onClick={() => handleToggleActive(template.id, template.active)}>
                        <CircleCheckBig className="h-4 w-4" />
                        {template.active ? 'Disable' : 'Mark Active'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <CopyPlus className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePreview(template.id)}>
                        <Eye className="h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteTargetId(template.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EmailTemplateSheet open={sheetOpen} templateId={sheetTemplateId} onClose={handleSheetClose} readOnly={sheetReadOnly} />

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete email template?"
        description="This action cannot be undone. This will permanently delete this email template."
        confirmationText="Delete"
        confirmationTextVariant="destructive"
        showInput={false}
      />
    </>
  )
}
