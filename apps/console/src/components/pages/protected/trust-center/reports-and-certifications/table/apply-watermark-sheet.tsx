import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { ChevronDown, Droplet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { orClear, useDirtyInput, type TFieldMappers } from '@/hooks/useDirtyInput'
import { type TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { normalizeHexColor } from '@/utils/normalizeHexColor'
import { useUpdateTrustCenterWatermarkConfig } from '@/lib/graphql-hooks/trust-center'
import { TrustCenterWatermarkConfigFont, type UpdateTrustCenterWatermarkConfigInput } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { TrustCenterWatermarkConfigFontMapper, TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'
import { SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { Callout } from '@/components/shared/callout/callout'

type WatermarkConfigUI = {
  id?: string
  text?: string | null
  fontSize?: number | null
  color?: string | null
  opacity?: number | null
  rotation?: number | null
  isEnabled?: boolean | null
  font?: TrustCenterWatermarkConfigFont | null
  file?: {
    presignedURL?: string | null
  } | null
}

enum WatermarkTypeEnum {
  TEXT = 'text',
  FILE = 'file',
  DISABLE_WATERMARK_CONFIG = 'disable_watermark_config',
}

type ApplyWatermarkSheetProps = {
  watermarkConfig: WatermarkConfigUI
}

const DEFAULT_WATERMARK_COLOR = '#000000'
const DEFAULT_WATERMARK_TYPE = WatermarkTypeEnum.TEXT
const DEFAULT_WATERMARK_FONT = TrustCenterWatermarkConfigFont.COURIER

type WatermarkFormValues = {
  type: WatermarkTypeEnum
  text: string
  fontSize?: number
  color: string
  opacity?: number
  rotation?: number
  font: TrustCenterWatermarkConfigFont
}

const toOptionalNumber = (value: string | number) => (value === '' ? undefined : Number(value))

const toWatermarkFormValues = (config: WatermarkConfigUI): WatermarkFormValues => ({
  type: config?.isEnabled === false ? WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG : DEFAULT_WATERMARK_TYPE,
  text: config?.text ?? '',
  fontSize: config?.fontSize ?? 24,
  color: normalizeHexColor(config?.color) ?? DEFAULT_WATERMARK_COLOR,
  opacity: config?.opacity ?? 0.2,
  rotation: config?.rotation ?? -45,
  font: config?.font ?? DEFAULT_WATERMARK_FONT,
})

const WATERMARK_UPDATE_FIELDS = {
  type: (type) => ({ isEnabled: type !== WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG }),
  text: orClear('clearText'),
  fontSize: orClear('clearFontSize'),
  color: (value) => {
    const color = normalizeHexColor(value)
    return color ? { color } : { clearColor: true }
  },
  opacity: orClear('clearOpacity'),
  rotation: orClear('clearRotation'),
  font: orClear('clearFont'),
} satisfies TFieldMappers<WatermarkFormValues, UpdateTrustCenterWatermarkConfigInput>

const ApplyWatermarkSheet = ({ watermarkConfig }: ApplyWatermarkSheetProps) => {
  const { id } = watermarkConfig ?? {}
  const storedValues = useMemo(() => toWatermarkFormValues(watermarkConfig), [watermarkConfig])

  const form = useForm<WatermarkFormValues>({ defaultValues: storedValues })
  const { control, register, reset, setValue, formState } = form
  const buildDirtyInput = useDirtyInput(form)
  const selected = useWatch({ control, name: 'type' })
  const disableWatermarkConfig = selected === WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const { mutateAsync: updateWatermark, isPending: updating } = useUpdateTrustCenterWatermarkConfig()
  const { successNotification, errorNotification } = useNotification()

  useEffect(() => {
    setUploadedFile(null)
    reset(storedValues)
  }, [storedValues, reset])

  const isWatermarkDirty = !!uploadedFile || formState.isDirty

  const discardAndClose = () => {
    setIsDiscardDialogOpen(false)
    setUploadedFile(null)
    reset(storedValues)
    setSheetOpen(false)
  }

  const selectType = (type: WatermarkTypeEnum) => setValue('type', type, { shouldDirty: true })

  const handleSheetClose = () => {
    if (isWatermarkDirty) {
      setIsDiscardDialogOpen(true)
      return
    }

    discardAndClose()
  }

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setUploadedFile(uploaded.file)
  }

  const handleApplyWatermark = async (values: WatermarkFormValues) => {
    const changedInput = await buildDirtyInput<UpdateTrustCenterWatermarkConfigInput>(values, WATERMARK_UPDATE_FIELDS)
    const input: UpdateTrustCenterWatermarkConfigInput = disableWatermarkConfig ? (changedInput.isEnabled === false ? { isEnabled: false } : {}) : changedInput
    const watermarkFile = disableWatermarkConfig ? undefined : (uploadedFile ?? undefined)

    if (Object.keys(input).length === 0 && !watermarkFile) {
      discardAndClose()
      return
    }

    try {
      await updateWatermark({
        updateTrustCenterWatermarkConfigId: id ?? '',
        input,
        ...(watermarkFile ? { watermarkFile } : {}),
      })

      successNotification({
        title: 'Watermark updated',
        description: 'Watermark settings have been successfully saved.',
      })
    } catch (err) {
      const message = parseErrorMessage(err)
      errorNotification({
        title: 'Failed to save watermark',
        description: message,
      })
    } finally {
      setSheetOpen(false)
      setUploadedFile(null)
    }
  }

  return (
    <>
      <Button variant="secondary" icon={<Droplet size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setSheetOpen(true)}>
        Watermark
      </Button>

      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : handleSheetClose())}>
        <SheetContent
          header={
            <SlideoutHeader
              title="Watermark Document"
              onClose={handleSheetClose}
              formActions={
                <SlideoutFormActions
                  onSave={form.handleSubmit(handleApplyWatermark)}
                  onCancel={handleSheetClose}
                  isPending={updating}
                  saveLabel={disableWatermarkConfig ? 'Save' : 'Apply watermark'}
                  savingLabel={disableWatermarkConfig ? 'Saving...' : 'Applying...'}
                />
              }
            />
          }
        >
          <div className="flex flex-col justify-baseline gap-5">
            <Callout variant="info" title="Applies to new documents only." compact>
              This watermark setting will be used for all newly generated documents. Existing documents are not changed and can be overridden individually.
            </Callout>
            <div className="flex flex-col max-w gap-4">
              <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="watermark"
                  value={WatermarkTypeEnum.TEXT}
                  checked={selected === WatermarkTypeEnum.TEXT}
                  onChange={() => selectType(WatermarkTypeEnum.TEXT)}
                  className="sr-only"
                />
                <div
                  className={`mr-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
   ${selected === WatermarkTypeEnum.TEXT ? 'border-5 border-primary' : ''}`}
                >
                  {selected === WatermarkTypeEnum.TEXT && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`font-medium ${selected === WatermarkTypeEnum.TEXT ? 'font-medium leading-6 text-base' : 'font-medium leading-6 text-base text-muted-foreground'}`}>
                    Text Watermark
                  </div>
                  <div className="text-gray-500 text-sm">Add custom text overlay to your content</div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="watermark"
                  value={WatermarkTypeEnum.FILE}
                  checked={selected === WatermarkTypeEnum.FILE}
                  onChange={() => selectType(WatermarkTypeEnum.FILE)}
                  className="sr-only"
                />
                <div
                  className={`mr-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
      ${selected === WatermarkTypeEnum.FILE ? 'border-5 border-primary' : ''}`}
                >
                  {selected === WatermarkTypeEnum.FILE && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`font-medium ${selected === WatermarkTypeEnum.FILE ? 'font-medium leading-6 text-base' : 'font-medium leading-6 text-base text-muted-foreground'}`}>
                    File Watermark
                  </div>
                  <div className="text-gray-500 text-sm">Upload a logo or image as watermark</div>
                </div>
              </label>
              <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="watermark"
                  value={WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG}
                  checked={selected === WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG}
                  onChange={() => selectType(WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG)}
                  className="sr-only"
                />
                <div
                  className={`mr-4 w-5 h-5 rounded-full border-2 flex items-center justify-center
      ${selected === WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG ? 'border-5 border-primary' : ''}`}
                >
                  {selected === WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG && <div className="w-2 h-2 rounded-full bg-destructive-foreground" />}
                </div>
                <div className="flex flex-col gap-1">
                  <div
                    className={`font-medium ${selected === WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG ? 'font-medium leading-6 text-base' : 'font-medium leading-6 text-base text-muted-foreground'}`}
                  >
                    No Watermark
                  </div>
                  <div className="text-gray-500 text-sm">Do not apply a watermark to newly generated documents</div>
                </div>
              </label>
              {selected === WatermarkTypeEnum.FILE && (
                <div className="flex gap-7 w-full">
                  <div className="w-full">
                    <FileUpload
                      acceptedFileTypes={['image/jpeg', 'image/png', 'image/svg+xml']}
                      onFileUpload={handleUpload}
                      acceptedFileTypesShort={['PNG', 'JPG', 'SVG']}
                      maxFileSizeInMb={5}
                      multipleFiles={false}
                    />
                  </div>
                </div>
              )}
              {selected === WatermarkTypeEnum.TEXT && (
                <div className="flex gap-7">
                  <div className="flex flex-col gap-3 w-full">
                    <Label className="text-sm">Text watermark</Label>
                    <Input {...register('text')} placeholder="Enter watermark text…" />
                  </div>
                </div>
              )}
              {selected !== WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG && (
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="TITLE">
                    <AccordionTrigger asChild>
                      <button className="group flex w-full items-center justify-between text-sm font-medium bg-unset">
                        <span>Advanced Settings</span>

                        <ChevronDown size={22} className="text-brand transition-transform duration-200 rotate-0 group-data-[state=open]:rotate-180" />
                      </button>
                    </AccordionTrigger>

                    <AccordionContent className="mt-4 grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Font size</Label>
                        <Input type="number" {...register('fontSize', { setValueAs: toOptionalNumber })} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Font family</Label>
                        <Controller
                          control={control}
                          name="font"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={(value) => field.onChange(value as TrustCenterWatermarkConfigFont)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select font" />
                              </SelectTrigger>
                              <SelectContent>
                                {TrustCenterWatermarkConfigFontOptions.map((font) => (
                                  <SelectItem key={font.value} value={font.value}>
                                    {TrustCenterWatermarkConfigFontMapper[font.value as TrustCenterWatermarkConfigFont]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Controller control={control} name="color" render={({ field }) => <ColorInput label="Color" value={field.value} onChange={field.onChange} />} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Opacity</Label>
                        <Input type="number" step="0.05" min={0} max={1} {...register('opacity', { setValueAs: toOptionalNumber })} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Rotation (°)</Label>
                        <Input type="number" {...register('rotation', { setValueAs: toOptionalNumber })} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>

          <CancelDialog isOpen={isDiscardDialogOpen} onConfirm={discardAndClose} onCancel={() => setIsDiscardDialogOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default ApplyWatermarkSheet
