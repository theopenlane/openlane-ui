import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Copy, Check, CircleAlert } from 'lucide-react'
import { type ContactUserStatus, type GetContactsQuery } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type ContactNode = NonNullable<NonNullable<NonNullable<GetContactsQuery['contacts']['edges']>[number]>['node']>

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

const StatusCell: React.FC<{ status: ContactUserStatus }> = ({ status }) => {
  const isActive = status === 'ACTIVE'
  return (
    <div className="flex items-center gap-1.5">
      {isActive ? <Check size={14} className="text-success" /> : <CircleAlert size={14} className="text-muted-foreground" />}
      <span>{getEnumLabel(status)}</span>
    </div>
  )
}

export { StatusCell, CopyButton }
export type { ContactNode }

const ContactCard: React.FC<{ contact: ContactNode; onClick?: () => void }> = ({ contact, onClick }) => (
  <Card className="cursor-pointer" onClick={onClick}>
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

export default ContactCard
