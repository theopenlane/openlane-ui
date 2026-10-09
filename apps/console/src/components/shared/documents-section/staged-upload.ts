import { type FileMetadataInput } from '@repo/codegen/src/schema'

export type StagedUpload = {
  id: string
  file: File
  name: string
  category: string
}

export type FileUploadArgs = {
  files: File[]
  metadata: FileMetadataInput[]
}

export const toFileUploadArgs = (uploads: StagedUpload[]): FileUploadArgs =>
  uploads.reduce<FileUploadArgs>(
    (args, { file, name, category }) => {
      const displayName = name.trim() || file.name
      const categoryName = category.trim()

      args.files.push(file)
      args.metadata.push(categoryName ? { name: displayName, metadata: { category: categoryName } } : { name: displayName })

      return args
    },
    { files: [], metadata: [] },
  )
