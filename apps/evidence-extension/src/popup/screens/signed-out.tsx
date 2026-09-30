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
      description="Sign in to capture screenshots and upload them as evidence. Openlane creates a personal access token for this extension, scoped to the organization you choose."
    />
    {notice && <ErrorAlert>{notice}</ErrorAlert>}
    <Button full icon={<ExternalLink size={14} />} onClick={openConnectPage}>
      Connect your Openlane account
    </Button>
  </div>
)
