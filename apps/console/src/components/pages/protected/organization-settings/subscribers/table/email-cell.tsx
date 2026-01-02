import { Copy } from 'lucide-react'
import { pageStyles } from '@/components/pages/protected/organization-settings/subscribers/page.styles.tsx'
import { useNotification } from '@/hooks/useNotification.tsx'

type TEmailCellProps = {
  email: string
}

const EmailCell: React.FC<TEmailCellProps> = (props: TEmailCellProps) => {
  const { nameRow, copyIcon } = pageStyles()
  const { successNotification } = useNotification()

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(props.email)
    successNotification({
      title: 'Copied to clipboard',
    })
  }

  return (
    <div className={nameRow()}>
      {props.email}
      <Copy width={16} height={16} className={copyIcon()} onClick={() => handleCopyToClipboard()} />
    </div>
  )
}

export default EmailCell
