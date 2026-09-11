import { type TFile } from '@/components/shared/file-table/columns'

export type TEvidenceFilesColumn = Pick<TFile, 'id' | 'name' | 'providedFileName' | 'providedFileSize' | 'presignedURL' | 'providedFileExtension' | 'metadata' | 'createdAt'>
