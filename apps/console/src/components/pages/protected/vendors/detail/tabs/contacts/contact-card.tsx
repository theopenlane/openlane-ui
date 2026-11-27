import React from 'react'
import { Card, CardContent } from '@theopenlane/ui/cardpanel'
import { CopyIconButton } from '@/components/shared/copy-icon-button/copy-icon-button'
import { type GetContactsQuery } from '@repo/codegen/src/schema'
import { UserStatusBadge } from '@/components/shared/enum-mapper/user-status-enum'

type ContactNode = NonNullable<NonNullable<NonNullable<GetContactsQuery['contacts']['edges']>[number]>['node']>

export type { ContactNode }

const ContactCard: React.FC<{ contact: ContactNode; onClick?: () => void }> = ({ contact, onClick }) => (
  <Card className="cursor-pointer" onClick={onClick}>
    <CardContent className="p-5">
      <div className="mb-4">
        <p className="font-semibold text-sm">{contact.fullName}</p>
        {contact.email && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm text-muted-foreground">{contact.email}</span>
            <CopyIconButton value={contact.email} label="email" />
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
            {contact.phoneNumber && <CopyIconButton value={contact.phoneNumber} label="phone number" />}
          </div>
        </div>
        <div className="border-l border-border px-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Address</p>
          <p className="text-sm truncate">{contact.address ?? '-'}</p>
        </div>
        <div className="border-l border-border px-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
          <UserStatusBadge status={contact.status} />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default ContactCard
