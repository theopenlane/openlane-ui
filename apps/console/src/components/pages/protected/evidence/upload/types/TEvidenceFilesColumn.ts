export type TEvidenceFilesColumn = {
  id: string
  providedFileName: string
  providedFileSize?: number | null
  presignedURL?: string | null
  providedFileExtension: string
  categoryName?: string | null
  createdAt?: string | null
}
