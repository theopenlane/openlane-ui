'use client'

import React, { useMemo } from 'react'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { Copy } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { CodeBlock } from '@repo/ui/code-block'
import { useNotification } from '@/hooks/useNotification'
import type { TReportQueryConfig } from '@/lib/report/report-config'
import { buildReportQueryForConfig } from '@/lib/report/saved-report'

type TReportQueryTabProps = {
  config: TReportQueryConfig
  pageSize: number
  hasEntity: boolean
}

const ReportQueryTab: React.FC<TReportQueryTabProps> = ({ config, pageSize, hasEntity }) => {
  const { successNotification } = useNotification()
  const [, copyToClipboard] = useCopyToClipboard()

  const preview = useMemo(() => {
    const built = hasEntity ? buildReportQueryForConfig(config, pageSize) : null
    if (!built) return null

    return { query: built.query, variables: Object.keys(built.variables).length > 0 ? JSON.stringify(built.variables, null, 2) : '' }
  }, [config, hasEntity, pageSize])

  const handleCopyQuery = () => {
    if (!preview) return

    copyToClipboard(preview.query)
    successNotification({ title: 'Copied to clipboard', variant: 'success' })
  }

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-medium">Generated query</p>

        <Button className="ml-auto" type="button" variant="outline" size="md" icon={<Copy size={14} />} iconPosition="left" disabled={!preview} onClick={handleCopyQuery}>
          Copy
        </Button>
      </div>

      {preview ? (
        <>
          <CodeBlock code={preview.query} language="graphql" />
          {preview.variables && <CodeBlock code={preview.variables} language="json" title="Variables" />}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{hasEntity ? 'Select at least one column to see the query.' : 'Choose a data type to see the query.'}</p>
      )}
    </>
  )
}

export default ReportQueryTab
