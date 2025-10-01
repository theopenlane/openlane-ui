import { TabsContent } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { PlusCircle } from 'lucide-react'
import { PolicyProcedureTabEnum } from '@/components/shared/enum-mapper/policy-procedure-tab-enum'

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
      <div className="flex w-full items-center">
        <div className="w-4/5">
          <Input variant="medium" className="w-full" placeholder="Paste URL here" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <div className="w-1/5 flex justify-center">
          <PlusCircle className="w-8 h-8 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={handleAddProcedureLink} />
        </div>
      </div>
    </TabsContent>
  )
}

export default DirectLinkCreatePolicyProcedureTab
