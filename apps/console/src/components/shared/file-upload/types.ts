export type TUploadedFile = {
  name?: string
  size?: number | undefined
  url?: string
  type: 'file' | 'link' | 'existingFile'
  file?: File | null
  id?: string
  category?: string | null
  createdAt?: string
  width?: number
  height?: number
}
