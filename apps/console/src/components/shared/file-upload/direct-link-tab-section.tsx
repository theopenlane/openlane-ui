import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Input } from '@repo/ui/input'
import { Plus } from 'lucide-react'

type TDirectLinkTab = {
  link?: string | undefined
  setLink: React.Dispatch<React.SetStateAction<string>>
  handleAddProcedureLink: () => Promise<void>
  ariaLabel?: string | undefined
}

const DirectLinkTabSection: React.FC<TDirectLinkTab> = ({ link, setLink, handleAddProcedureLink, ariaLabel }: TDirectLinkTab) => {
  return (
    <Card className="p-5">
      <div className="flex flex-col items-start gap-2">
        <p>Add URL</p>
        <div className="flex w-full items-center justify-between">
          <div className="w-4/5">
            <Input className="w-full h-8" placeholder="Paste URL here" value={link} onChange={(e) => setLink(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" className="h-8 px-2" onClick={handleAddProcedureLink} aria-label={ariaLabel}>
            <div className="flex items-center gap-1">
              <Plus className="w-5 h-5 cursor-pointer hover:scale-105 transition-transform" />
              <p>Add URL</p>
            </div>
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default DirectLinkTabSection
