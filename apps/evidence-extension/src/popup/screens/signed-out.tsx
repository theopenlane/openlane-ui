import { ExternalLink } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { CONNECT_URL } from '../../lib/config'
import { ErrorAlert } from '../components/error-alert'
import { ScreenTitle } from '../components/popup-header'

type TSignedOutProps = {
  notice?: string
}

const openConnectPage = async () => {
  await chrome.tabs.create({ url: CONNECT_URL })
  window.close()
}

export const SignedOut = ({ notice }: TSignedOutProps) => (
  <div className="space-y-4 p-4">
    <ScreenTitle
      title="Connect to Openlane"
      description="Capture screenshots and upload them as evidence. An organization owner or admin connects the extension to your organization, and Openlane shows what it can access before you confirm."
    />
    {notice && <ErrorAlert>{notice}</ErrorAlert>}
    <Button full icon={<ExternalLink size={14} />} onClick={openConnectPage}>
      Connect to your organization
    </Button>
  </div>
)
