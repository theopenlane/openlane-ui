import { Copy } from 'lucide-react'
import { pageStyles } from '@/components/pages/protected/organization/subscribers/page.styles.tsx'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useNotification } from '@/hooks/useNotification.tsx'

type TEmailCellProps = {
  email: string
}

const EmailCell: React.FC<TEmailCellProps> = (props: TEmailCellProps) => {
  const { nameRow, copyIcon } = pageStyles()
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const { successNotification } = useNotification()

  const handleCopyToClipboard = () => {
    //@todo probably needs to be re-implemented and added to clipboard not to state
    copyToClipboard(props.email)
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
