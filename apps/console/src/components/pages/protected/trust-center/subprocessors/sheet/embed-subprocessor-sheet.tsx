'use client'

import React, { useMemo } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'

type EmbedSubprocessorSheetProps = {
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  slug: string
}

const TRUST_CENTER_HOST = 'trust.theopenlane.net'

export const EmbedSubprocessorSheet: React.FC<EmbedSubprocessorSheetProps> = ({ open, onOpenChangeAction, slug }) => {
  const { successNotification } = useNotification()

  const domain = `${TRUST_CENTER_HOST}/${slug}`

  const snippet = useMemo(
    () =>
      `<script src="https://${TRUST_CENTER_HOST}/embed/subprocessors.js"
  data-domain="${domain}"
  data-theme="auto"
  defer>
</script>`,
    [domain],
  )

  const previewSrcDoc = useMemo(() => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${snippet}</body></html>`, [snippet])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet)
    successNotification({ title: 'Copied', description: 'Embed snippet copied to clipboard.' })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent side="right" className="w-[480px] sm:w-[520px] overflow-y-auto">
        <SheetTitle />
        <SheetDescription />
        <SheetHeader>
          <div className="flex justify-between">
            <PanelRightClose aria-label="Close embed sheet" size={16} className="cursor-pointer" onClick={() => onOpenChangeAction(false)} />
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
              <iframe srcDoc={previewSrcDoc} title="Subprocessor embed preview" className="w-full h-[400px] rounded-md border" sandbox="allow-scripts allow-same-origin" />
            </TabsContent>
          </Tabs>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Content Security Policy:</span> If you use a strict CSP, allow scripts from:
              <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{TRUST_CENTER_HOST}</code>
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
