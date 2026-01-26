import { TabsContent } from '@repo/ui/tabs'
import { PolicyProcedureTabEnum } from '@/components/shared/enum-mapper/policy-procedure-tab-enum'
import DirectLinkTab from '../file-upload/direct-link-tab-section'

type TDirectLinkCreatePolicyProcedureTabProps = {
  onAddLink?: (link: string) => void
  link: string
  setLink: React.Dispatch<React.SetStateAction<string>>
}

const DirectLinkCreatePolicyProcedureTab: React.FC<TDirectLinkCreatePolicyProcedureTabProps> = ({ onAddLink, link, setLink }: TDirectLinkCreatePolicyProcedureTabProps) => {
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddProcedureLink = async () => {
    if (link.trim() === '' || !isValidUrl(link)) return

    if (onAddLink) {
      onAddLink(link)
    }
  }

  return (
    <TabsContent value={PolicyProcedureTabEnum.DirectLink}>
      <DirectLinkTab link={link} setLink={setLink} handleAddProcedureLink={handleAddProcedureLink} ariaLabel={'Create policy procedure'} />
    </TabsContent>
  )
}

export default DirectLinkCreatePolicyProcedureTab
