'use client'

import React, { useMemo } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useNotification } from '@/hooks/useNotification'

type EmbedSubprocessorSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const EmbedSubprocessorSheet: React.FC<EmbedSubprocessorSheetProps> = ({ open, onOpenChange }) => {
  const { data: session } = useSession()
  const { successNotification } = useNotification()

  const orgId = session?.user?.activeOrganizationId ?? ''

  const snippet = useMemo(
    () =>
      `<div id="openlane-subprocessors"></div>
<script src="https://trust.theopenlane.net/embed/subprocessors.js"
  data-org="${orgId}"
  data-theme="auto">
</script>`,
    [orgId],
  )

  const embedPreviewUrl = `https://trust.theopenlane.net/embed/subprocessors?org=${orgId}&theme=auto`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    successNotification({ title: 'Copied', description: 'Embed snippet copied to clipboard.' })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:w-[520px] overflow-y-auto">
        <SheetTitle />
        <SheetDescription />
        <SheetHeader>
          <div className="flex justify-between">
            <PanelRightClose aria-label="Close embed sheet" size={16} className="cursor-pointer" onClick={() => onOpenChange(false)} />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold">Embed Subprocessor Table</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Paste this snippet into your marketing site where you want the table to appear. It will stay up to date as you add or edit subprocessors in Openlane.
            </p>
          </div>

          <Tabs defaultValue="code">
            <TabsList>
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="mt-3">
              <div className="relative">
                <Button variant="secondary" onClick={handleCopy} className="absolute top-2 right-2 h-8 px-2" type="button">
                  <Copy size={14} />
                </Button>
                <pre className="bg-secondary rounded-md p-4 pr-12 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all border">{snippet}</pre>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-3">
              <iframe src={embedPreviewUrl} title="Subprocessor embed preview" className="w-full h-[400px] rounded-md border" sandbox="allow-scripts allow-same-origin" />
            </TabsContent>
          </Tabs>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Content Security Policy:</span> If you use a strict CSP, allow scripts from:{' '}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">trust.theopenlane.net</code>
            </p>
            <p>
              <span className="font-medium text-foreground">Caching:</span> Updates may take up to 5 minutes to reflect due to caching.
            </p>
            <p>
              <span className="font-medium text-foreground">Theming:</span> Set <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">data-theme</code> to{' '}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">&quot;light&quot;</code>, <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">&quot;dark&quot;</code>, or{' '}
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">&quot;auto&quot;</code> (default, follows OS preference).
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
