'use client'
import React, { useCallback, useState } from 'react'
import { File, FileUp, Upload } from 'lucide-react'
import { FileWithPath, useDropzone } from 'react-dropzone'
import { cn } from '@repo/ui/lib/utils'
import { useNotification } from '@/hooks/useNotification'

type TProps = {
  onFileUpload: (uploadedFile: TUploadedFile) => void
  maxFileSizeInMb: number
  acceptedFileTypes: string[]
  acceptedFileTypesShort: string[]
  multipleFiles: boolean
  acceptedFilesClass?: string
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

        reader.onload = () => {
          const fileUrl = reader.result as string
          const newFile: TUploadedFile = { name: file.name, size: file.size, url: fileUrl, type: 'file', file: file }
          if (!props.multipleFiles) {
            setUploadedFile(newFile)
          }
          props.onFileUpload(newFile)
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
        className={cn('relative rounded border-dashed border border-teal-800/40 py-5 px-[110px] text-center h-[200px] flex items-center justify-center transition ease-in', {
          'border-teal-800': isDragActive,
        })}
      >
        <input {...getInputProps()} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative inline-block">
            <div className="relative w-24 h-24 flex justify-center items-center">
              {!uploadedFile && <FileUp className="w-16 h-16" />}
              {uploadedFile && (
                <>
                  <File className="w-16 h-16" />
                  <Upload className="absolute bottom-4 right-4 w-5 h-5 bg-jade-500 dark:bg-jade-500 rounded-full p-1 shadow-md" />
                </>
              )}
            </div>
          </div>
          {uploadedFile && (
            <div>
              <div className="font-semibold">{uploadedFile.name}</div>
              <div className="text-sm">Size: {(uploadedFile.size! / 1024).toFixed(2)} KB</div>
            </div>
          )}
          {!uploadedFile && (
            <p>
              Drag and drop files here or{' '}
              <span className="underline cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                choose file
              </span>
            </p>
          )}
        </div>
      </div>
      <div className={props.acceptedFilesClass ?? 'mt-4 flex justify-between text-sm'}>
        <div>{props.acceptedFileTypesShort.join(', ')}</div>
        <div>Maximum size: {MAX_FILE_SIZE_IN_MB} MB / file</div>
      </div>
    </React.Fragment>
  )
}

export default FileUpload
