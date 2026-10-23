'use client'

import Image from 'next/image'
import { LoaderCircle, PenLine, Pencil, RefreshCw, Signature, Sparkles } from 'lucide-react'
import { isSignatureMethod, SIGNATURE_PAD_HEIGHT, SIGNATURE_PAD_WIDTH } from '@theopenlane/surveyjs-components'
import {
  registerSignatureFieldRenderer,
  SIGNATURE_METHOD_DESCRIPTIONS,
  SIGNATURE_METHOD_LABELS,
  SurveySignatureField,
  TYPED_SIGNATURE_MESSAGES,
  type TSignatureFieldView,
} from '@theopenlane/surveyjs-components/survey'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'

const TypedSignaturePreview = ({ typedPreview, signerName, canChange, regenerate }: TSignatureFieldView) => {
  switch (typedPreview.kind) {
    case 'signature':
      return <Image src={typedPreview.src} alt={`Signature of ${signerName}`} width={SIGNATURE_PAD_WIDTH} height={SIGNATURE_PAD_HEIGHT} unoptimized className="h-full w-full object-contain" />
    case 'rendering':
      return <LoaderCircle className="animate-spin text-gray-500" size={24} aria-label={TYPED_SIGNATURE_MESSAGES.generating} />
    case 'failed':
      return (
        <div className="flex flex-col items-center gap-1 px-6 text-center text-sm text-gray-500">
          <p>{TYPED_SIGNATURE_MESSAGES.failed}</p>
          {canChange && (
            <Button type="button" variant="link" className="text-blue-500" onClick={regenerate}>
              Try again
            </Button>
          )}
        </div>
      )
    case 'missingName':
      return <p className="px-6 text-center text-sm text-gray-500">{TYPED_SIGNATURE_MESSAGES.missingName}</p>
  }
}

const TypedSignature = (view: TSignatureFieldView) => (
  <>
    <div className={cn('relative flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white', !view.canChange && 'border-dashed')}>
      <TypedSignaturePreview {...view} />
      {view.canChange && (
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          className="absolute right-3 top-3 hidden sm:inline-flex"
          icon={<PenLine />}
          descriptiveTooltipText="Draw your signature instead"
          onClick={() => view.selectMethod('drawn')}
        />
      )}
    </div>
    {view.typedPreview.kind === 'signature' && (
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <Sparkles size={14} className="shrink-0 text-primary" />
          <span className="truncate">Generated from full name “{view.signerName}”</span>
        </span>
        {view.canChange && (
          <Button type="button" variant="link" className="text-xs text-blue-500" icon={<RefreshCw />} iconPosition="left" onClick={view.regenerate}>
            Regenerate signature
          </Button>
        )}
      </div>
    )}
  </>
)

const SigningMethods = (view: TSignatureFieldView) => {
  const disabled = !view.canChange
  const handleMethodChange = (value: string) => {
    if (isSignatureMethod(value)) view.selectMethod(value)
  }

  return (
    <Tabs variant="solid" value={view.method} onValueChange={handleMethodChange} className="flex flex-col gap-3 whitespace-normal rounded-lg border border-border p-4">
      <TabsList className="h-auto w-fit max-w-full flex-wrap" aria-label="Signature method">
        <TabsTrigger value="typed" disabled={disabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50">
          <Signature size={16} />
          {SIGNATURE_METHOD_LABELS.typed}
        </TabsTrigger>
        <TabsTrigger value="drawn" disabled={disabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50">
          <Pencil size={16} />
          {SIGNATURE_METHOD_LABELS.drawn}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="typed" className="mt-0 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{SIGNATURE_METHOD_DESCRIPTIONS.typed}</p>
        <TypedSignature {...view} />
      </TabsContent>
      <TabsContent value="drawn" className="mt-0 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">{SIGNATURE_METHOD_DESCRIPTIONS.drawn}</p>
        {view.signaturePad}
      </TabsContent>
    </Tabs>
  )
}

class OpenlaneSignatureField extends SurveySignatureField {
  protected renderSigningMethods(view: TSignatureFieldView) {
    return <SigningMethods {...view} />
  }
}

registerSignatureFieldRenderer(OpenlaneSignatureField)
