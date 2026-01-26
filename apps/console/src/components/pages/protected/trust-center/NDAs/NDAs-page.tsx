'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { FileText, Loader2, Eye, RefreshCw, FileUp, Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { NDAUploadDialog } from './components/NDA-upload-dialog'
import { useGetTrustCenterNDAFiles } from '@/lib/graphql-hooks/trust-center-NDA'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { formatDate } from '@/utils/date'

const NDAsPage = () => {
  const { latestFile, isLoading, latestTemplate } = useGetTrustCenterNDAFiles()
  const { setCrumbs } = useContext(BreadcrumbContext)
  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'NDAs', href: '/trust-center/NDAs' }])
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
    <div className="flex w-full justify-center py-8">
      <div className="grid w-full max-w-[1200px] gap-4 px-6">
        <div>
          <PageHeading heading="NDAs" />
          <h3 className="mt-6 text-lg font-medium text-white">NDA Document</h3>
        </div>

        <Card>
          <CardContent>
            {!latestFile ? (
              <div className="flex flex-col items-center justify-center text-center gap-4">
                <FileUp size={24} />
                <div>
                  <h4 className="text-lg font-semibold text-white">No NDA uploaded</h4>
                  <p className="mt-1 text-sm text-muted-foreground">Upload your NDA here using the button below</p>
                </div>
                <NDAUploadDialog
                  trigger={
                    <Button icon={<Plus />} iconPosition="left">
                      Upload
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-lg border bg-homepage-card-item border-muted p-4">
                  <div className="rounded-lg border border-muted p-2">
                    <FileText className="h-6 w-6 " />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{latestFile.providedFileName}</div>
                    <div className="text-xs text-muted-foreground">Size: 1.1mb</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={handleDownload}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <NDAUploadDialog
                      ndaId={latestTemplate?.id}
                      trigger={
                        <Button variant="secondary" iconPosition="left" icon={<RefreshCw />}>
                          Replace
                        </Button>
                      }
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">Last Updated • {formatDate(latestFile.updatedAt)}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NDAsPage
