'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { CheckCircle2, FileText, Loader2, Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { NDAUploadDialog } from './components/NDA-upload-dialog'
import { useGetTrustCenterNDAFiles } from '@/lib/graphql-hooks/trust-center-NDA'
import { format } from 'date-fns'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const NDAsPage = () => {
  const { latestFile, isLoading, latestTemplate } = useGetTrustCenterNDAFiles()
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'ANDAs', href: '/trust-center/NDAs' }])
  }, [setCrumbs])

  const handleDownload = () => {
    if (latestFile?.presignedURL) {
      window.open(latestFile.presignedURL, '_blank')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex w-full justify-center py-4">
      <div className="grid w-full max-w-[1200px] gap-6">
        <PageHeading heading="Non-Disclosure Agreements" />

        {!latestFile ? (
          <div className="flex flex-col items-start gap-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <span>No NDA document uploaded yet.</span>
            </div>
            <NDAUploadDialog triggerText="Upload NDA" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>
                NDA: {latestFile.providedFileName} • updated: {format(new Date(latestFile.updatedAt), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleDownload} className="flex gap-2">
                <Download className="h-4 w-4" />
                View PDF
              </Button>
              <NDAUploadDialog triggerText="Replace Document" ndaId={latestTemplate?.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NDAsPage
