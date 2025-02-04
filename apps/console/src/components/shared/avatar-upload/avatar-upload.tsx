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

interface AvatarUploadProps extends AvatarUploadVariants {
  className?: string
  placeholderImage?: string
  fallbackString?: string
  uploadCallback: (arg: Scalars['Upload']['input']) => void
}

const AvatarUpload = ({ className, placeholderImage, uploadCallback, fallbackString }: AvatarUploadProps) => {
  const [isCroppingModalOpen, setIsCroppingModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<null | string>()
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

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
        <DialogContent className="w-[600px] max-w-[100%]">
          <DialogHeader>
            <DialogTitle>Edit your avatar</DialogTitle>
            <DialogDescription>Please crop, resize and click 'Save avatar'</DialogDescription>
          </DialogHeader>
          <div className={cropContainer()}>
            {uploadedImage && <Cropper image={uploadedImage} crop={crop} zoom={zoom} aspect={1} cropShape="rect" showGrid={false} onCropChange={onCropChange} onCropComplete={onCropComplete} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={saveCroppedImage}>Save avatar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}

export { AvatarUpload }
