'use client'

import { Copy } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

type EmailAliasesCellProps = {
  emails?: string[] | null
}

export const EmailAliasesCell: React.FC<EmailAliasesCellProps> = ({ emails }) => {
  const { successNotification } = useNotification()

  if (!emails?.length) {
    return <div>-</div>
  }

  const handleCopy = (email: string) => {
    navigator.clipboard.writeText(email)
    successNotification({ title: 'Copied to clipboard' })
  }

  return (
    <div className="flex flex-col gap-1">
      {emails.map((email) => (
        <div key={email} className="group flex items-center gap-2">
          <span>{email}</span>
          <Copy width={14} height={14} className="cursor-pointer text-muted-foreground opacity-0 group-hover:opacity-100" onClick={() => handleCopy(email)} />
        </div>
      ))}
    </div>
  )
}
