'use client'
import React, { useCallback } from 'react'
import { File, Upload } from 'lucide-react'
import { TabsContent } from '@repo/ui/tabs'
import { FileWithPath, useDropzone } from 'react-dropzone'
import { cn } from '@repo/ui/lib/utils'
import { useToast } from '@repo/ui/use-toast'

type TProps = {
  uploadedFile: (uploadedFile: TUploadedFilesProps) => void
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100 MB
const MAX_FILE_SIZE_IN_MB = MAX_FILE_SIZE / (1024 * 1024)

const UploadTab: React.FC<TProps> = (props: TProps) => {
  const { toast } = useToast()
  const acceptedFileTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'text/plain',
    'text/plain; charset=utf-8',
    'application/zip',
    'application/rtf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.text',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-vnd.oasis.opendocument.spreadsheet',
    'text/csv',
    'application/x-yaml',
    'application/x-yaml; charset=utf-8',
    'text/yaml',
    'application/json',
    'application/json; charset=utf-8',
  ]

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Error',
          description: `exceeds the maximum file size of ${MAX_FILE_SIZE_IN_MB} MB.`,
          variant: 'destructive',
          duration: 5000,
        })
        return false
      }
      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: `${file.name} is not an accepted file type.`,
          variant: 'destructive',
          duration: 5000,
        })
        return false
      }
      return true
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onload = () => {
        const fileUrl = reader.result as string
        const newFile: TUploadedFilesProps = { name: file.name, size: file.size, url: fileUrl, type: 'file', file: file }
        props.uploadedFile(newFile)
      }

      reader.readAsDataURL(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  })

  return (
    <TabsContent value="upload">
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
              <File className="w-16 h-16" />
              <Upload className="absolute bottom-4 right-4 w-5 h-5 bg-jade-500 dark:bg-jade-500 rounded-full p-1 shadow-md" />
            </div>
          </div>
          <p>
            Drag and drop files here or{' '}
            <span className="underline cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
              choose file
            </span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <div>PDF, DOC(X), CSV, XLSX, TXT, PNG, JPG, ZIP, YAML</div>
        <div>Maximum size: {MAX_FILE_SIZE_IN_MB} MB / file</div>
      </div>
    </TabsContent>
  )
}

export default UploadTab
