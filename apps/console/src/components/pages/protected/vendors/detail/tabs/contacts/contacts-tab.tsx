'use client'

import React, { useState, useMemo } from 'react'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Check, CircleAlert, Copy, DownloadIcon, Plus, SearchIcon } from 'lucide-react'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import Menu from '@/components/shared/menu/menu'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import { useContacts, useCreateBulkCSVContact, useBulkDeleteContact, useBulkEditContact } from '@/lib/graphql-hooks/contact'
import { useNotification } from '@/hooks/useNotification'
import { ContactUserStatus, type GetContactsQuery, type UpdateContactInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { GenericBulkCSVCreateDialog } from '@/components/shared/crud-base/dialog/bulk-csv-create-dialog'
import { GenericBulkEditDialog } from '@/components/shared/crud-base/dialog/bulk-edit'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { z } from 'zod'
import AddContactDialog from './add-contact-dialog'

type ContactNode = NonNullable<NonNullable<NonNullable<GetContactsQuery['contacts']['edges']>[number]>['node']>

interface ContactsTabProps {
  vendorId: string
  canEdit: boolean
}

type ViewMode = 'table' | 'card'

const COLUMN_VISIBILITY_DEFAULTS: VisibilityState = {
  fullName: true,
  email: true,
  title: true,
  phoneNumber: true,
  address: true,
  status: true,
}

const STATUS_LABELS: Record<ContactUserStatus, string> = {
  [ContactUserStatus.ACTIVE]: 'Active',
  [ContactUserStatus.INACTIVE]: 'Inactive',
  [ContactUserStatus.DEACTIVATED]: 'Deactivated',
  [ContactUserStatus.ONBOARDING]: 'Onboarding',
  [ContactUserStatus.SUSPENDED]: 'Suspended',
}

const bulkEditFieldSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  status: z.nativeEnum(ContactUserStatus).optional(),
})

const statusEnumOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

const StatusCell: React.FC<{ status: ContactUserStatus }> = ({ status }) => {
  const isActive = status === ContactUserStatus.ACTIVE
  return (
    <div className="flex items-center gap-1.5">
      {isActive ? <Check size={14} className="text-success" /> : <CircleAlert size={14} className="text-muted-foreground" />}
      <span>{STATUS_LABELS[status] ?? status}</span>
    </div>
  )
}

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const { successNotification } = useNotification()

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    successNotification({ title: 'Copied', description: `"${value}" copied to clipboard.` })
  }

  return (
    <button type="button" onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      <Copy size={13} />
    </button>
  )
}

const DATA_COLUMNS: ColumnDef<ContactNode>[] = [
  {
    accessorKey: 'fullName',
    header: 'Name',
    size: 150,
    cell: ({ row }) => <span className="truncate">{row.original.fullName ?? '-'}</span>,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    size: 180,
    cell: ({ row }) => <span className="truncate">{row.original.email ?? '-'}</span>,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    size: 180,
    cell: ({ row }) => <span className="truncate">{row.original.title ?? '-'}</span>,
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
    size: 150,
    cell: ({ row }) => <span>{row.original.phoneNumber ?? '-'}</span>,
  },
  {
    accessorKey: 'address',
    header: 'Address',
    size: 200,
    cell: ({ row }) => <span className="truncate">{row.original.address ?? '-'}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    cell: ({ row }) => <StatusCell status={row.original.status} />,
  },
]

const mappedColumns = DATA_COLUMNS.filter((column): column is ColumnDef<ContactNode> & { accessorKey: string; header: string } => {
  const col = column as { accessorKey?: string; header?: string }
  return typeof col.accessorKey === 'string' && typeof col.header === 'string'
}).map((column) => ({
  accessorKey: column.accessorKey,
  header: column.header as string,
}))

const ContactCard: React.FC<{ contact: ContactNode }> = ({ contact }) => (
  <Card>
    <CardContent className="p-5">
      <div className="mb-4">
        <p className="font-semibold text-sm">{contact.fullName}</p>
        {contact.email && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm text-muted-foreground">{contact.email}</span>
            <CopyButton value={contact.email} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 pt-4">
        <div className="px-4 first:pl-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Title</p>
          <p className="text-sm">{contact.title ?? '-'}</p>
        </div>
        <div className="border-l border-border px-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{contact.phoneNumber ?? '-'}</span>
            {contact.phoneNumber && <CopyButton value={contact.phoneNumber} />}
          </div>
        </div>
        <div className="border-l border-border px-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Address</p>
          <p className="text-sm truncate">{contact.address ?? '-'}</p>
        </div>
        <div className="border-l border-border px-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
          <StatusCell status={contact.status} />
        </div>
      </div>
    </CardContent>
  </Card>
)

const ContactsTab: React.FC<ContactsTabProps> = ({ vendorId, canEdit: canEditVendor }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const handleViewChange = (tab: 'table' | 'card') => setViewMode(tab)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.VENDOR_CONTACTS, COLUMN_VISIBILITY_DEFAULTS))
  const [selectedContacts, setSelectedContacts] = useState<{ id: string }[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()

  const { contacts, isLoading } = useContacts({
    where: { hasEntitiesWith: [{ id: vendorId }] },
    enabled: true,
  })

  const { mutateAsync: createBulkCSVContact } = useCreateBulkCSVContact()
  const { mutateAsync: bulkDeleteContacts } = useBulkDeleteContact()
  const { mutateAsync: bulkEditContacts } = useBulkEditContact()

  const columns = useMemo<ColumnDef<ContactNode>[]>(() => [createSelectColumn<ContactNode>(selectedContacts, setSelectedContacts), ...DATA_COLUMNS], [selectedContacts])

  const handleBulkCreate = async (file: File) => {
    try {
      await createBulkCSVContact({ input: file })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
      throw error
    }
  }

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return
    try {
      await bulkDeleteContacts({ ids: selectedContacts.map((c) => c.id) })
      successNotification({ title: 'Selected contacts have been successfully deleted.' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    } finally {
      setIsBulkDeleteDialogOpen(false)
      setSelectedContacts([])
    }
  }

  const handleExportCSV = () => {
    if (contacts.length === 0) return

    const headers = ['Name', 'Email', 'Title', 'Phone', 'Address', 'Status']
    const rows = contacts.map((c) => [c.fullName ?? '', c.email ?? '', c.title ?? '', c.phoneNumber ?? '', c.address ?? '', STATUS_LABELS[c.status] ?? c.status])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'vendor-contacts.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const filteredContacts = contacts.filter((contact) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      contact.fullName?.toLowerCase().includes(term) ||
      contact.email?.toLowerCase().includes(term) ||
      contact.title?.toLowerCase().includes(term) ||
      contact.phoneNumber?.toLowerCase().includes(term) ||
      contact.address?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <Input icon={<SearchIcon size={16} />} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} variant="searchTable" />

        <TableCardView activeTab={viewMode} onTabChange={handleViewChange} />

        <div className="grow flex flex-row items-center gap-2 justify-end">
          {selectedContacts.length > 0 ? (
            <>
              {canEditVendor && (
                <GenericBulkEditDialog<{ id: string }, UpdateContactInput>
                  open={isBulkEditDialogOpen}
                  onOpenChange={setIsBulkEditDialogOpen}
                  selectedItems={selectedContacts}
                  setSelectedItems={setSelectedContacts}
                  schema={bulkEditFieldSchema}
                  bulkEditMutation={{
                    mutateAsync: async ({ ids, input }) => {
                      await bulkEditContacts({ ids, input })
                    },
                  }}
                  enumOpts={{ statusOptions: statusEnumOptions }}
                  entityType={ObjectTypes.CONTACT}
                />
              )}
              {canEditVendor && (
                <>
                  <Button type="button" variant="secondary" onClick={() => setIsBulkDeleteDialogOpen(true)}>
                    {`Bulk Delete (${selectedContacts.length})`}
                  </Button>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkDelete}
                    title="Delete selected contacts?"
                    description={<>This action cannot be undone. This will permanently delete selected contacts.</>}
                    confirmationText="Delete"
                    confirmationTextVariant="destructive"
                    showInput={false}
                  />
                </>
              )}
              <CancelButton onClick={() => setSelectedContacts([])} />
            </>
          ) : (
            <>
              <Menu
                closeOnSelect={true}
                content={(close) => (
                  <>
                    {canEditVendor && <GenericBulkCSVCreateDialog entityType={ObjectTypes.CONTACT} onBulkCreate={handleBulkCreate} />}
                    <Button
                      size="sm"
                      variant="transparent"
                      className="px-1 flex items-center justify-start space-x-2 cursor-pointer"
                      onClick={() => {
                        handleExportCSV()
                        close()
                      }}
                    >
                      <DownloadIcon size={16} strokeWidth={2} />
                      <span>Export</span>
                    </Button>
                  </>
                )}
              />
              <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.VENDOR_CONTACTS} />
              <TableFilter filterFields={[]} onFilterChange={() => {}} pageKey={TableKeyEnum.VENDOR_CONTACTS} />
              {canEditVendor && (
                <Button icon={<Plus size={16} />} iconPosition="left" onClick={() => setShowAddDialog(true)}>
                  Add Contact
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredContacts}
          loading={isLoading}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          tableKey={TableKeyEnum.VENDOR_CONTACTS}
          noResultsText="No contacts associated with this vendor."
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Loading contacts...</CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No contacts associated with this vendor.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}

      {showAddDialog && <AddContactDialog vendorId={vendorId} onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

export default ContactsTab
