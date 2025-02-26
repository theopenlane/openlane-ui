import React, { useEffect, useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { FormItem } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { PlusCircle } from 'lucide-react'

type TProps = {
  directLink: (uploadedFile: TUploadedFilesProps) => void
  evidenceFiles: TUploadedFilesProps[]
  handleDelete: (fileName: string) => void
}

const DirectLinkTab: React.FC<TProps> = (props: TProps) => {
  const [evidenceDirectLink, setEvidenceDirectLink] = useState<string>('')
  const [evidenceLinkAdded, setEvidenceLinkAdded] = useState<boolean>(false)

  useEffect(() => {
    const linkAdded = props.evidenceFiles?.some((item) => item.type === 'link')
    linkAdded && setEvidenceLinkAdded(true)
    !linkAdded && setEvidenceLinkAdded(false)
  }, [props.evidenceFiles?.length])

  const handleAddLink = () => {
    if (evidenceLinkAdded) {
      return
    }

    if (evidenceDirectLink.trim() !== '') {
      const newFile: TUploadedFilesProps = { url: evidenceDirectLink, type: 'link', name: evidenceDirectLink }
      props.directLink(newFile)
      setEvidenceDirectLink('')
    }
  }

  return (
    <TabsContent value="directLink">
      <FormItem className="w-full">
        <div className="flex w-full items-center">
          <div className="w-4/5">
            <Input variant="medium" className="w-full" placeholder="Paste URL here" value={evidenceDirectLink} onChange={(e) => setEvidenceDirectLink(e.target.value)} disabled={evidenceLinkAdded} />
          </div>
          <div className="w-1/5 flex justify-center">
            <PlusCircle className="w-8 h-8 text-primary cursor-pointer hover:scale-105 transition-transform" onClick={handleAddLink} />
          </div>
        </div>
      </FormItem>
    </TabsContent>
  )
}

export default DirectLinkTab
