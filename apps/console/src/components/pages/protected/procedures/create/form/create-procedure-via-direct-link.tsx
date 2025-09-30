import { TabsContent } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { PlusCircle } from 'lucide-react'

type TDirectLinkCreateTabProps = {
  onAddLink?: (link: string) => void
  procedureMdDocumentLink: string
  setProcedureMdDocumentLink: React.Dispatch<React.SetStateAction<string>>
}

const DirectLinkCreateTab: React.FC<TDirectLinkCreateTabProps> = ({ onAddLink, procedureMdDocumentLink, setProcedureMdDocumentLink }: TDirectLinkCreateTabProps) => {
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddProcedureLink = async () => {
    if (procedureMdDocumentLink.trim() === '' || !isValidUrl(procedureMdDocumentLink)) return

    if (onAddLink) {
      onAddLink(procedureMdDocumentLink)
    }
  }

  return (
    <TabsContent value="directLink">
      <div className="flex w-full items-center">
        <div className="w-4/5">
          <Input variant="medium" className="w-full" placeholder="Paste URL here" value={procedureMdDocumentLink} onChange={(e) => setProcedureMdDocumentLink(e.target.value)} />
        </div>
        <div className="w-1/5 flex justify-center">
          <PlusCircle className="w-8 h-8 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={handleAddProcedureLink} />
        </div>
      </div>
    </TabsContent>
  )
}

export default DirectLinkCreateTab
