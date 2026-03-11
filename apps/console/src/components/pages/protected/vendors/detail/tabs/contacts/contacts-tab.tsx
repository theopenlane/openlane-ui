'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { useContacts } from '@/lib/graphql-hooks/contact'
import AddContactDialog from './add-contact-dialog'

interface ContactsTabProps {
  vendorId: string
  canEdit: boolean
}

const ContactsTab: React.FC<ContactsTabProps> = ({ vendorId, canEdit: canEditVendor }) => {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const { contacts, isLoading } = useContacts({
    where: { hasEntitiesWith: [{ id: vendorId }] },
    enabled: true,
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading contacts...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {canEditVendor && (
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => setShowAddDialog(true)} icon={<Plus size={16} />} iconPosition="left">
            Add Contact
          </Button>
        </div>
      )}

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No contacts associated with this vendor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{contact.fullName}</p>
                  {contact.title && <p className="text-xs text-muted-foreground">{contact.title}</p>}
                  {contact.email && (
                    <p className="text-xs">
                      <a href={`mailto:${contact.email}`} className="text-blue-500 hover:underline">
                        {contact.email}
                      </a>
                    </p>
                  )}
                  {contact.company && <p className="text-xs text-muted-foreground">{contact.company}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddDialog && <AddContactDialog vendorId={vendorId} onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

export default ContactsTab
