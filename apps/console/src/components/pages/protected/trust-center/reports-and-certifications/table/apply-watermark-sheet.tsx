import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ChevronDown, Droplet, InfoIcon, PanelRightClose, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ColorInput } from '@/components/shared/color-input/color-input'
import { useUpdateTrustCenterWatermarkConfig } from '@/lib/graphql-hooks/trust-center'
import { TrustCenterWatermarkConfigFont } from '@repo/codegen/src/schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { TrustCenterWatermarkConfigFontMapper, TrustCenterWatermarkConfigFontOptions } from '@/components/shared/enum-mapper/trust-center-enum'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type WatermarkConfigUI = {
  id?: string
  text?: string | null
  fontSize?: number | null
  color?: string | null
  opacity?: number | null
  rotation?: number | null
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

const ApplyWatermarkSheet = ({ watermarkConfig }: ApplyWatermarkSheetProps) => {
  const { id, text, fontSize, color, opacity, rotation } = watermarkConfig ?? {}

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const [wmText, setWmText] = useState(text ?? '')
  const [wmFontSize, setWmFontSize] = useState(fontSize ?? 24)

  const [wmColor, setWmColor] = useState(color ?? '#000000')

  const [wmOpacity, setWmOpacity] = useState(opacity ?? 0.2)
  const [wmRotation, setWmRotation] = useState(rotation ?? -45)
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)
  const [selected, setSelected] = useState<WatermarkTypeEnum>(WatermarkTypeEnum.TEXT)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState<boolean>(false)
  const { mutateAsync: updateWatermark, isPending: updating } = useUpdateTrustCenterWatermarkConfig()
  const { successNotification, errorNotification } = useNotification()
  const [selectedFont, setSelectedFont] = useState<TrustCenterWatermarkConfigFont>(TrustCenterWatermarkConfigFont.COURIER)
  const [disableWatermarkConfig, setDisableWatermarkConfig] = useState<boolean>(false)
  useEffect(() => {
    if (!watermarkConfig) {
      setUploadedFile(null)
      setWmText('')
      setWmFontSize(24)
      setWmColor('#000000')
      setWmOpacity(0.2)
      setWmRotation(-45)
      return
    }
    const { text, fontSize, color, opacity, rotation } = watermarkConfig
    setWmText(text ?? '')
    setWmFontSize(fontSize ?? 24)
    setWmColor(color ?? '#000000')
    setWmOpacity(opacity ?? 0.2)
    setWmRotation(rotation ?? -45)
  }, [watermarkConfig])

  useEffect(() => {
    setDisableWatermarkConfig(selected === WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG)
  }, [selected])

  const handleSheetClose = () => {
    setIsDiscardDialogOpen(true)
  }

  const handleUpload = (uploaded: TUploadedFile) => {
    if (!uploaded.file) return
    setUploadedFile(uploaded.file)
  }

  const handleApplyWatermark = async () => {
    try {
      await updateWatermark({
        updateTrustCenterWatermarkConfigId: id!,
        input: disableWatermarkConfig
          ? {
              isEnabled: false,
            }
          : {
              ...(wmText ? { text: wmText } : { clearText: true }),
              ...(wmFontSize ? { fontSize: wmFontSize } : { clearFontSize: true }),
              ...(wmColor ? { color: wmColor } : { clearColor: true }),
              ...(wmRotation ? { rotation: wmRotation } : { clearRotation: true }),
              ...(selectedFont ? { font: selectedFont } : { clearFont: true }),
              isEnabled: true,
            },
        ...(disableWatermarkConfig ? {} : uploadedFile ? { watermarkFile: uploadedFile } : {}),
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          header={
            <SheetHeader>
              <div className="flex items-center justify-between">
                <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={handleSheetClose} />

                <div className="flex justify-end gap-2">
                  <X aria-label="Close sheet" size={20} className="cursor-pointer" onClick={handleSheetClose} />
                </div>
              </div>
              <div className="flex items-center justify-between my-5">
                <SheetTitle>
                  <p className="text-2xl leading-8 font-medium">Watermark Document</p>
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <CancelButton onClick={handleSheetClose}></CancelButton>
                  <SaveButton onClick={handleApplyWatermark} title={disableWatermarkConfig ? (updating ? 'Saving...' : 'Save') : updating ? 'Applying...' : 'Apply watermark'} />
                </div>
              </div>
            </SheetHeader>
          }
        >
          <div className="flex flex-col justify-baseline gap-5">
            <div className="w-full flex items-start gap-2 border rounded-lg p-2.5 bg-card">
              <InfoIcon size={14} className="mt-1 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm leading-5 text-foreground">Applies to new documents only.</p>
                <p className="font-normal text-xs leading-4">
                  This watermark setting will be used for all newly generated documents. Existing documents are not changed and can be overridden individually.
                </p>
              </div>
            </div>
            <div className="flex flex-col max-w gap-4">
              <label className="flex items-center p-4 border border-border rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="watermark"
                  value={WatermarkTypeEnum.TEXT}
                  checked={selected === WatermarkTypeEnum.TEXT}
                  onChange={() => setSelected(WatermarkTypeEnum.TEXT)}
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
                  onChange={() => setSelected(WatermarkTypeEnum.FILE)}
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
                  onChange={() => setSelected(WatermarkTypeEnum.DISABLE_WATERMARK_CONFIG)}
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
                    <Input value={wmText} onChange={(e) => setWmText(e.target.value)} placeholder="Enter watermark text…" />
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
                        <Input type="number" value={wmFontSize} onChange={(e) => setWmFontSize(Number(e.target.value))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Font family</Label>
                        <Select value={selectedFont} onValueChange={(value) => setSelectedFont(value as TrustCenterWatermarkConfigFont)}>
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
                      </div>
                      <div className="flex flex-col gap-1">
                        <ColorInput label="Color" value={wmColor} onChange={setWmColor} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Opacity</Label>
                        <Input type="number" step="0.05" min={0} max={1} value={wmOpacity} onChange={(e) => setWmOpacity(Number(e.target.value))} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <Label className="text-sm">Rotation (°)</Label>
                        <Input type="number" value={wmRotation} onChange={(e) => setWmRotation(Number(e.target.value))} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>

          <CancelDialog
            isOpen={isDiscardDialogOpen}
            onConfirm={() => {
              setIsDiscardDialogOpen(false)
              setUploadedFile(null)
              setSheetOpen(false)
            }}
            onCancel={() => setIsDiscardDialogOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default ApplyWatermarkSheet
