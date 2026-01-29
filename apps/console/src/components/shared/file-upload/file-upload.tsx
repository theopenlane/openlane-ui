'use client'
import React, { useCallback, useState } from 'react'
import { File, FileUp, Upload } from 'lucide-react'
import { FileWithPath, useDropzone } from 'react-dropzone'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

type TProps = {
  onFileUpload: (uploadedFile: TUploadedFile) => void
  maxFileSizeInMb: number
  acceptedFileTypes: string[]
  acceptedFileTypesShort: string[]
  multipleFiles: boolean
  acceptedFilesClass?: string
  note?: string
}

const FileUpload: React.FC<TProps> = (props: TProps) => {
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const MAX_FILE_SIZE = props.maxFileSizeInMb * 1024 * 1024 // e.g. 100 MB
  const MAX_FILE_SIZE_IN_MB = MAX_FILE_SIZE / (1024 * 1024)
  const { errorNotification } = useNotification()

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          errorNotification({
            title: 'Error',
            description: `exceeds the maximum file size of ${MAX_FILE_SIZE_IN_MB} MB.`,
          })
          return false
        }
        if (!props.acceptedFileTypes.includes(file.type)) {
          errorNotification({
            title: 'Error',
            description: `${file.name} is not an accepted file type.`,
          })
          return false
        }
        return true
      })

      validFiles.forEach((file) => {
        const reader = new FileReader()

        if (file.type.startsWith('image/')) {
          reader.onload = () => {
            const fileUrl = reader.result as string

            const img = new Image()
            img.onload = () => {
              const newFile: TUploadedFile = {
                name: file.name,
                size: file.size,
                url: fileUrl,
                type: 'file',
                file: file,
                width: img.naturalWidth,
                height: img.naturalHeight,
              }

              if (!props.multipleFiles) {
                setUploadedFile(newFile)
              }

              props.onFileUpload(newFile)
            }

            img.src = fileUrl
          }
        } else {
          reader.onload = () => {
            const fileUrl = reader.result as string
            const newFile: TUploadedFile = { name: file.name, size: file.size, url: fileUrl, type: 'file', file: file }
            if (!props.multipleFiles) {
              setUploadedFile(newFile)
            }
            props.onFileUpload(newFile)
          }
        }

        reader.readAsDataURL(file)
      })
    },
    [MAX_FILE_SIZE, MAX_FILE_SIZE_IN_MB, errorNotification, props],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: props.multipleFiles,
    accept: props.acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  })

  return (
    <React.Fragment>
      <div
        {...getRootProps()}
        className={cn('rounded-lg border border-dashed border-muted-foreground/40 bg-card h-[200px] flex items-center justify-center text-center cursor-pointer transition-all', {
          'border-primary bg-muted/50 ring-1 ring-primary/30': isDragActive,
        })}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-md bg-border border border-muted flex items-center justify-center">
            {!uploadedFile && <FileUp className="w-7 h-7" />}
            {uploadedFile && (
              <>
                <File className="w-16 h-16" />
                <Upload className="absolute bottom-4 right-4 w-5 h-5 bg-jade-500 dark:bg-jade-500 rounded-full p-1 shadow-md" />
              </>
            )}
          </div>

          {!uploadedFile && (
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-5 font-medium">
                Drag and drop files or <span className="underline">click to upload</span>
              </p>
              <p className="text-sm font-normal leading-5 text-muted-foreground">
                Accepted: {props.acceptedFileTypesShort.join(', ')} (Max file size: {MAX_FILE_SIZE_IN_MB}MB)
              </p>
              {props.note && <p className="text-sm font-normal leading-5 text-muted-foreground">{props.note}</p>}
            </div>
          )}

          {uploadedFile && (
            <div className="text-sm w-full max-w-[200px] overflow-hidden">
              <div className="font-semibold truncate" title={uploadedFile.name}>
                {uploadedFile.name}
              </div>
              <div className="text-muted-foreground">{(uploadedFile.size! / 1024).toFixed(2)} KB</div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  )
}

export default FileUpload
