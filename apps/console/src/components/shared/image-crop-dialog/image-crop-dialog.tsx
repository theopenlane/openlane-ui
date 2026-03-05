'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area, type MediaSize, type Point } from 'react-easy-crop'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { SaveButton } from '../save-button/save-button'
import { CancelButton } from '../cancel-button.tsx/cancel-button'
import getCroppedImg from './utils/getCroppedImage'

interface ImageCropDialogProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedFile: File) => void
  aspect?: number
  title?: string
  description?: string
  outputFileName?: string
  outputMimeType?: string
}

const getMimeTypeFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

const ImageCropDialog = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspect: fixedAspect,
  title = 'Crop Image',
  description = 'Adjust the crop area and click Save',
  outputFileName = 'cropped-image.jpg',
  outputMimeType,
}: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [detectedAspect, setDetectedAspect] = useState<number>(1)

  const resolvedAspect = fixedAspect ?? detectedAspect
  const resolvedMimeType = outputMimeType ?? getMimeTypeFromFileName(outputFileName)

  const onCropChange = (crop: Point) => {
    setCrop(crop)
  }

  const onCropAreaComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const onMediaLoaded = useCallback(
    (mediaSize: MediaSize) => {
      if (fixedAspect === undefined) {
        setDetectedAspect(mediaSize.naturalWidth / mediaSize.naturalHeight)
      }
    },
    [fixedAspect],
  )

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    try {
      const croppedImageUrl = await getCroppedImg(imageSrc, croppedAreaPixels, resolvedMimeType)
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], outputFileName, { type: resolvedMimeType })

      onCropComplete(file)
      onClose()
    } catch (error) {
      console.error('Error saving cropped image:', error)
    }
  }

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.01, 3))
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.01, 1))
  }

  return (
    <Dialog open={open}>
      <DialogContent className="w-[600px] max-w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-4 justify-center">
          <Button variant="primary" onClick={handleZoomOut} className="w-8 h-8">
            −
          </Button>
          <span className="text-sm">Zoom: {zoom.toFixed(2)}×</span>
          <Button variant="primary" onClick={handleZoomIn} className="w-8 h-8">
            +
          </Button>
        </div>
        <div className="relative h-[350px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={resolvedAspect}
            cropShape="rect"
            showGrid={false}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={setZoom}
            onMediaLoaded={onMediaLoaded}
            minZoom={1}
            maxZoom={3}
          />
        </div>
        <DialogFooter>
          <CancelButton onClick={onClose} />
          <SaveButton onClick={handleSave} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ImageCropDialog }
