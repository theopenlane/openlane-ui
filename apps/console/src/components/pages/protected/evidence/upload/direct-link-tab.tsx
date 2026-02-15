'use client'
import React, { useEffect, useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { FormItem } from '@repo/ui/form'
import { CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { TUploadedFile } from './types/TUploadedFile'
import DirectLinkTabSection from '@/components/shared/file-upload/direct-link-tab-section'

type TProps = {
  directLink: (uploadedFile: TUploadedFile) => void
  evidenceFiles: TUploadedFile[]
  form: CreateEvidenceFormMethods
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
        <DirectLinkTabSection setLink={setEvidenceDirectLink} handleAddProcedureLink={handleAddLink} ariaLabel={'Create evidence'} />
        {props.form.formState.errors.url && <p className="text-red-500 text-sm">{props.form.formState.errors.url.message}</p>}
      </FormItem>
    </TabsContent>
  )
}

export default DirectLinkTab
