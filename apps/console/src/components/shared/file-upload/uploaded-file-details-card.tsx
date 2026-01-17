import { Card } from '@repo/ui/cardpanel'
import { FileText, Trash2 } from 'lucide-react'

type TUploadedFileDetailsCard = {
  index: number
  fileName?: string | undefined
  fileSize?: number | undefined
  handleDeleteFile: (index: number) => void
}

const UploadedFileDetailsCard: React.FC<TUploadedFileDetailsCard> = ({ fileName, fileSize, index, handleDeleteFile }: TUploadedFileDetailsCard) => {
  return (
    <Card className="w-[136px] p-2 shadow-[0px_1px_2px_0px_#09151D0A]">
      <div className="flex flex-col gap-2 p-1">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-md bg-border border border-muted flex items-center justify-center">
            <FileText size={16} />
          </div>
          <Trash2 size={16} className="hover:cursor-pointer text-muted-foreground" onClick={() => handleDeleteFile(index)} />
        </div>
        <div>
          <div title={fileName} className="font-medium text-sm leading-5 truncate max-w-full">
            {fileName}
          </div>
          <div className="text-xs font-normal leading-4 text-muted-foreground truncate">Size: {Math.round(fileSize! / 1024)} KB</div>
        </div>
      </div>
    </Card>
  )
}

export default UploadedFileDetailsCard
