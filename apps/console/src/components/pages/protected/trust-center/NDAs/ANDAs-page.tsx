'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { NDAUploadDialog } from './components/NDA-upload-dialog'
import { useGetTrustCenterNDARequests } from '@/lib/graphql-hooks/trust-center-NDA'
import { format } from 'date-fns'

const ANDAsPage = () => {
  const { ndaRequests, isLoading } = useGetTrustCenterNDARequests()

  const latestNda = ndaRequests?.[0]

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

        {!latestNda ? (
          <div className="flex flex-col items-start gap-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-5 w-5" />
              <span>No NDA document uploaded yet.</span>
            </div>
            <NDAUploadDialog triggerText="Upload NDA" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center gap-2 font-medium text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>NDA uploaded • last updated {format(new Date(latestNda.updatedAt), 'MMM d, yyyy')}</span>
            </div>

            <div className="flex gap-3">
              <NDAUploadDialog triggerText="Replace Document" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ANDAsPage
