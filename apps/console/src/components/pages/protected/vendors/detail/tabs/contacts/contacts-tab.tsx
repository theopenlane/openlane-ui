'use client'

import React, { useState, useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { type TPagination } from '@repo/ui/pagination-types'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { DownloadIcon, Plus, SearchIcon } from 'lucide-react'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { FilterIcons } from '@/components/shared/enum-mapper/filter-icons'
import Menu from '@/components/shared/menu/menu'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import { useContactsWithFilter, useCreateBulkCSVContact, useBulkEditContact } from '@/lib/graphql-hooks/contact'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { ContactUserStatus, type UpdateContactInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { GenericBulkCSVCreateDialog } from '@/components/shared/crud-base/dialog/bulk-csv-create-dialog'
import { GenericBulkEditDialog } from '@/components/shared/crud-base/dialog/bulk-edit'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { z } from 'zod'
import type { FilterField, WhereCondition } from '@/types'
import ContactCard, { StatusCell, type ContactNode } from './contact-card'
import AddContactDialog from './add-contact-dialog'
import ContactDetailSheet from './contact-detail-sheet'

interface ContactsTabProps {
  vendorId: string
  canEdit: boolean
  vendorName: string
}

type ViewMode = 'table' | 'card'

const bulkEditFieldSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  status: z.nativeEnum(ContactUserStatus).optional(),
})

const statusEnumOptions = enumToOptions(ContactUserStatus)

const CONTACT_FILTER_FIELDS: FilterField[] = [
  { key: 'statusIn', label: 'Status', type: 'multiselect', icon: FilterIcons.Status, options: statusEnumOptions },
  { key: 'titleContainsFold', label: 'Title', type: 'text', icon: FilterIcons.Title },
]

const DATA_COLUMNS: ColumnDef<ContactNode>[] = [
  { accessorKey: 'fullName', header: 'Name', size: 150, cell: ({ row }) => <span className="block truncate">{row.original.fullName ?? '-'}</span> },
  { accessorKey: 'email', header: 'Email', size: 180, cell: ({ row }) => <span className="block truncate">{row.original.email ?? '-'}</span> },
  { accessorKey: 'title', header: 'Title', size: 180, cell: ({ row }) => <span className="block truncate">{row.original.title ?? '-'}</span> },
  { accessorKey: 'phoneNumber', header: 'Phone', size: 150, cell: ({ row }) => <span>{row.original.phoneNumber ?? '-'}</span> },
  { accessorKey: 'address', header: 'Address', size: 200, cell: ({ row }) => <span className="truncate">{row.original.address ?? '-'}</span> },
  { accessorKey: 'status', header: 'Status', size: 140, cell: ({ row }) => <StatusCell status={row.original.status} /> },
]

const mappedColumns = getMappedColumns(DATA_COLUMNS)

const ContactsTab: React.FC<ContactsTabProps> = ({ vendorId, canEdit: canEditVendor, vendorName }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const handleViewChange = (tab: 'table' | 'card') => setViewMode(tab)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.VENDOR_CONTACTS, DEFAULT_PAGINATION))
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.VENDOR_CONTACTS, {}))
  const [selectedContacts, setSelectedContacts] = useState<{ id: string }[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [filterWhere, setFilterWhere] = useState<WhereCondition>({})
  const { successNotification, errorNotification } = useNotification()

  const debouncedSearch = useDebounce(searchTerm, 300)
  const searchFields = debouncedSearch ? { fullNameContainsFold: debouncedSearch } : {}

  const {
    contactsNodes: contacts,
    isLoading,
    pageInfo,
    totalCount,
  } = useContactsWithFilter({
    where: { hasEntitiesWith: [{ id: vendorId }], ...filterWhere, ...searchFields },
    pagination,
  })

  const existingContactIds = useMemo(() => contacts.map((c) => c.id), [contacts])

  const { mutateAsync: createBulkCSVContact } = useCreateBulkCSVContact()
  const { mutateAsync: bulkEditContacts } = useBulkEditContact()
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const columns = useMemo<ColumnDef<ContactNode>[]>(() => [createSelectColumn<ContactNode>(selectedContacts, setSelectedContacts), ...DATA_COLUMNS], [selectedContacts])

  const handleBulkCreate = async (file: File) => {
    try {
      const result = await createBulkCSVContact({ input: file })
      const newContactIds = result.createBulkCSVContact?.contacts?.map((c) => c.id) ?? []
      if (newContactIds.length > 0) {
        await updateEntity({ updateEntityId: vendorId, input: { addContactIDs: newContactIds } })
      }
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
      throw error
    }
  }

  const handleBulkUnlink = async () => {
    if (selectedContacts.length === 0) return
    try {
      await updateEntity({ updateEntityId: vendorId, input: { removeContactIDs: selectedContacts.map((c) => c.id) } })
      successNotification({ title: 'Selected contacts have been unlinked from this vendor.' })
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
    const rows = contacts.map((c) => [c.fullName ?? '', c.email ?? '', c.title ?? '', c.phoneNumber ?? '', c.address ?? '', getEnumLabel(c.status)])

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
                    {`Remove (${selectedContacts.length})`}
                  </Button>
                  <ConfirmationDialog
                    open={isBulkDeleteDialogOpen}
                    onOpenChange={setIsBulkDeleteDialogOpen}
                    onConfirm={handleBulkUnlink}
                    title="Remove selected contacts from this vendor?"
                    description={<>This will unlink the selected contacts from this vendor. The contacts will not be deleted.</>}
                    confirmationText="Remove"
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
              <TableFilter filterFields={CONTACT_FILTER_FIELDS} onFilterChange={setFilterWhere} pageKey={TableKeyEnum.VENDOR_CONTACTS} />
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
          data={contacts}
          loading={isLoading}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={{ totalCount, pageInfo, isLoading }}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          tableKey={TableKeyEnum.VENDOR_CONTACTS}
          noResultsText="No contacts associated with this vendor."
          onRowClick={(row) => setSelectedContactId(row.id)}
        />
      ) : isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Loading contacts...</CardContent>
        </Card>
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No contacts associated with this vendor.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} onClick={() => setSelectedContactId(contact.id)} />
          ))}
        </div>
      )}

      {showAddDialog && <AddContactDialog vendorId={vendorId} onClose={() => setShowAddDialog(false)} vendorName={vendorName} existingContactIds={existingContactIds} />}

      {selectedContactId && <ContactDetailSheet contactId={selectedContactId} onClose={() => setSelectedContactId(null)} canEdit={canEditVendor} />}
    </div>
  )
}

export default ContactsTab
