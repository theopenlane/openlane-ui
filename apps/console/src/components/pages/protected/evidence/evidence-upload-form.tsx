import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import React, { useCallback, useState } from 'react'
import { cn } from '@repo/ui/lib/utils'
import { FileWithPath, useDropzone } from 'react-dropzone'
import { File, Trash2, Upload } from 'lucide-react'
import { Tooltip } from '@nextui-org/react'

const EvidenceUploadForm: React.FC = () => {
  const defaultTab = 'upload'
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; url: string }[]>([])
  const maxFileSize = 10 * 1024 * 1024 // 10 MB
  const acceptedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/csv', 'text/plain', 'image/png', 'image/jpeg']

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > maxFileSize) {
        alert(`${file.name} exceeds the maximum file size of 10 MB.`)
        return false
      }
      if (!acceptedFileTypes.includes(file.type)) {
        alert(`${file.name} is not an accepted file type.`)
        return false
      }
      return true
    })

    validFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onload = () => {
        const fileUrl = reader.result as string
        setUploadedFiles((prev) => [{ name: file.name, size: file.size, url: fileUrl }, ...prev])
      }

      reader.readAsDataURL(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  })

  const handleDelete = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName))
  }

  return (
    <Tabs variant="solid" defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="upload">Upload</TabsTrigger>
        <TabsTrigger value="directLink">Direct Link</TabsTrigger>
        <TabsTrigger value="existingFiles">Existing Files</TabsTrigger>
      </TabsList>
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
                <Upload className="absolute bottom-4 right-4 w-5 h-5 dark:bg-jade-500 rounded-full p-1 shadow-md" />
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
          <div>PDF, DOC(X), CSV, TXT, PNG, JPG</div>
          <div>Maximum size: 10 MB / file</div>
        </div>

        {uploadedFiles.map((file, index) => (
          <div key={index} className="border rounded p-3 mt-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-2">
                <img src="/path/to/icon.png" alt="File Icon" className="w-8 h-8" />
              </div>
              <div>
                <div className="font-semibold">{file.name}</div>
                <div className="text-sm">Size: {Math.round(file.size / 1024)} KB</div>
              </div>
            </div>
            <Tooltip>
              <Trash2 onClick={() => handleDelete(file.name)} />
            </Tooltip>
          </div>
        ))}
      </TabsContent>
      <TabsContent value="directLink">
        <Upload></Upload>
        <File></File>
      </TabsContent>
      <TabsContent value="existingFiles">Change your password here.</TabsContent>
    </Tabs>
  )
}

export default EvidenceUploadForm
