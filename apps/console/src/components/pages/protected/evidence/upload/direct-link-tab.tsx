'use client'
import React, { useEffect, useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { FormItem } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { PlusCircle } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { TUploadedFile } from './types/TUploadedFile'

type TProps = {
  directLink: (uploadedFile: TUploadedFile) => void
  evidenceFiles: TUploadedFile[]
  form: UseFormReturn<CreateEvidenceFormData>
}

const DirectLinkTab: React.FC<TProps> = (props: TProps) => {
  const [evidenceDirectLink, setEvidenceDirectLink] = useState<string>('')
  const [evidenceLinkAdded, setEvidenceLinkAdded] = useState<boolean>(false)

  useEffect(() => {
    const linkAdded = props.evidenceFiles?.some((item) => item.type === 'link')
    if (linkAdded) {
      setEvidenceLinkAdded(true)
    } else {
      setEvidenceLinkAdded(false)
    }
  }, [props.evidenceFiles?.length, props.evidenceFiles])

  const handleAddLink = async () => {
    if (evidenceLinkAdded || evidenceDirectLink.trim() === '') {
      return
    }

    props.form.setValue('url', evidenceDirectLink)
    const isUrlValid = await props.form.trigger('url')
    if (!isUrlValid) {
      props.form.setValue('url', undefined)
      return
    }

    const newFile: TUploadedFile = { url: evidenceDirectLink, type: 'link', name: evidenceDirectLink }
    props.directLink(newFile)
    setEvidenceDirectLink('')
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
        {props.form.formState.errors.url && <p className="text-red-500 text-sm">{props.form.formState.errors.url.message}</p>}
      </FormItem>
    </TabsContent>
  )
}

export default DirectLinkTab
