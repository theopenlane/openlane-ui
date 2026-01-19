'use client'

import { avatarUploadStyles, AvatarUploadVariants } from './avatar-upload.styles'
import { cn } from '@repo/ui/lib/utils'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { useCallback, useState } from 'react'
import { FileWithPath, useDropzone } from 'react-dropzone'
import { Button } from '@repo/ui/button'
import Cropper, { Area, Point } from 'react-easy-crop'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import getCroppedImg from './utils/getCroppedImage'
import { Scalars } from '@repo/codegen/src/schema'
import { SaveButton } from '../save-button/save-button'
import { CancelButton } from '../cancel-button.tsx/cancel-button'

interface AvatarUploadProps extends AvatarUploadVariants {
  className?: string
  placeholderImage?: string
  fallbackString?: string
  uploadCallback: (arg: Scalars['Upload']['input']) => void
}

const AvatarUpload = ({ className, placeholderImage, uploadCallback, fallbackString }: AvatarUploadProps) => {
  const [isCroppingModalOpen, setIsCroppingModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<null | string>()
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [zoom, setZoom] = useState(1)

  const dropMessage = 'Drop to upload!'
  const defaultMessage = (
    <>
      Drag your image in here, or <u>select it manually</u>.
    </>
  )

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()

    reader.onload = () => {
      setUploadedImage(reader.result as string)
      setIsCroppingModalOpen(true)
    }

    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  })

  const { wrapper, cropContainer, avatarPreview } = avatarUploadStyles({
    isDragActive,
  })

  const closeModal = () => {
    setIsCroppingModalOpen(false)
    setUploadedImage(null)
  }

  const onCropChange = (crop: Point) => {
    setCrop(crop)
  }

  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const saveCroppedImage = async () => {
    if (uploadedImage && croppedAreaPixels) {
      try {
        const croppedImageUrl = await getCroppedImg(uploadedImage, croppedAreaPixels)

        const response = await fetch(croppedImageUrl)
        const blob = await response.blob()

        const file = new File([blob], 'avatar.jpg', { type: blob.type })

        uploadCallback(file)

        setAvatarUrl(croppedImageUrl)
        closeModal()
      } catch (error) {
        console.error('Error saving cropped image:', error)
      }
    }
  }

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.1, 1))
  }

  return (
    <Panel>
      <PanelHeader heading="Avatar" noBorder />
      <div {...getRootProps()} className={cn(wrapper(), className)}>
        <input {...getInputProps()} />
        <p>{isDragActive ? dropMessage : defaultMessage}</p>
        <div className={avatarPreview()}>
          <Avatar variant="extra-large">
            {(avatarUrl || placeholderImage) && <AvatarImage src={avatarUrl || placeholderImage} />}
            <AvatarFallback>{fallbackString}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Dialog open={isCroppingModalOpen}>
        <DialogContent className="w-[600px] max-w-full">
          <DialogHeader>
            <DialogTitle>Edit your avatar</DialogTitle>
            <DialogDescription>Please crop, resize and click &apos;Save avatar&apos;</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-4 justify-center">
            <Button variant="primary" onClick={handleZoomOut} className="w-8 h-8">
              −
            </Button>
            <span className="text-sm">Zoom: {zoom.toFixed(1)}×</span>
            <Button variant="primary" onClick={handleZoomIn} className="w-8 h-8">
              +
            </Button>
          </div>
          <div className={cropContainer()}>
            {uploadedImage && (
              <div className="flex flex-col items-center space-y-4">
                <Cropper
                  image={uploadedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={false}
                  onCropChange={onCropChange}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  minZoom={1}
                  maxZoom={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <CancelButton onClick={closeModal}></CancelButton>
            <SaveButton onClick={saveCroppedImage} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

export { AvatarUpload }
