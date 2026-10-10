'use client'

import { createElement } from 'react'
import Image from 'next/image'
import { LoaderCircle, PenLine, Pencil, RefreshCw, Signature, Sparkles } from 'lucide-react'
import { ReactQuestionFactory, SurveyQuestionElementBase } from 'survey-react-ui'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { isTypedSignature } from './acknowledgement-type'
import { SIGNATURE_PAD_HEIGHT, SIGNATURE_PAD_QUESTION_TYPE, SIGNATURE_PAD_WIDTH } from '../signature-pad/signature-pad-type'
import { isSignatureMethod, SIGNATURE_QUESTION_TYPE, type QuestionAcknowledgementSignatureModel } from './acknowledgement-model'

class SurveyAcknowledgementSignature extends SurveyQuestionElementBase {
  protected get question(): QuestionAcknowledgementSignatureModel {
    return this.questionBase as QuestionAcknowledgementSignatureModel
  }

  private handleMethodChange = (value: string) => {
    if (isSignatureMethod(value)) this.question.selectSignatureMethod(value)
  }

  private handleDrawInstead = () => {
    this.question.selectSignatureMethod('drawn')
  }

  private handleRegenerate = () => {
    this.question.regenerateTypedSignature()
  }

  private renderSignaturePad() {
    return ReactQuestionFactory.Instance.createQuestion(SIGNATURE_PAD_QUESTION_TYPE, { question: this.question, isDisplayMode: this.isDisplayMode, creator: this.creator })
  }

  private renderTypedPreviewContent(signature: string) {
    const question = this.question
    if (signature)
      return <Image src={signature} alt={`Signature of ${question.signerName}`} width={SIGNATURE_PAD_WIDTH} height={SIGNATURE_PAD_HEIGHT} unoptimized className="h-full w-full object-contain" />
    if (question.typedSignatureStatus === 'rendering') return <LoaderCircle className="animate-spin text-gray-500" size={24} aria-label="Generating signature" />
    if (question.typedSignatureStatus === 'failed')
      return (
        <div className="flex flex-col items-center gap-1 px-6 text-center text-sm text-gray-500">
          <p>The signature could not be generated.</p>
          {question.canChangeSignature && (
            <Button type="button" variant="link" className="text-blue-500" onClick={this.handleRegenerate}>
              Try again
            </Button>
          )}
        </div>
      )
    return <p className="px-6 text-center text-sm text-gray-500">Enter your full name above to generate your signature.</p>
  }

  private renderTypedSignature() {
    const question = this.question
    const signature = isTypedSignature(question.value) ? question.value : ''
    return (
      <>
        <div className={cn('relative flex aspect-[3/1] w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-white', !question.canChangeSignature && 'border-dashed')}>
          {this.renderTypedPreviewContent(signature)}
          {question.canChangeSignature && (
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute right-3 top-3 hidden sm:inline-flex"
              icon={<PenLine />}
              descriptiveTooltipText="Draw your signature instead"
              onClick={this.handleDrawInstead}
            />
          )}
        </div>
        {signature && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Sparkles size={14} className="shrink-0 text-primary" />
              <span className="truncate">Generated from full name “{question.signerName}”</span>
            </span>
            {question.canChangeSignature && (
              <Button type="button" variant="link" className="text-xs text-blue-500" icon={<RefreshCw />} iconPosition="left" onClick={this.handleRegenerate}>
                Regenerate signature
              </Button>
            )}
          </div>
        )}
      </>
    )
  }

  protected renderElement() {
    const question = this.question
    if (question.isSurveyReadOnly) return this.renderSignaturePad()

    const disabled = !question.canChangeSignature
    return (
      <Tabs variant="solid" value={question.signatureMethod} onValueChange={this.handleMethodChange} className="flex flex-col gap-3 whitespace-normal rounded-lg border border-border p-4">
        <TabsList className="h-auto w-fit max-w-full flex-wrap" aria-label="Signature method">
          <TabsTrigger value="typed" disabled={disabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50">
            <Signature size={16} />
            Use full name
          </TabsTrigger>
          <TabsTrigger value="drawn" disabled={disabled} className="inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50">
            <Pencil size={16} />
            Draw signature
          </TabsTrigger>
        </TabsList>
        <TabsContent value="typed" className="mt-0 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Use your full name as your signature. A stylized signature will be generated from the name above.</p>
          {this.renderTypedSignature()}
        </TabsContent>
        <TabsContent value="drawn" className="mt-0 flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">Draw your signature in the box below.</p>
          {this.renderSignaturePad()}
        </TabsContent>
      </Tabs>
    )
  }
}

ReactQuestionFactory.Instance.registerQuestion(SIGNATURE_QUESTION_TYPE, (props) => createElement(SurveyAcknowledgementSignature, props))
