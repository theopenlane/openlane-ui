import { acceptedFileTypes as acceptedFiles, acceptedFileTypesShort as acceptedShort } from '@/components/shared/file-upload/file-upload-config'
import { type FileWhereInput } from '@repo/codegen/src/schema'

export const EVIDENCE_FILE_CATEGORY_WHERE: FileWhereInput = { categoryName: 'evidence' }

const evidenceMimeTypes = ['video/quicktime', 'video/mp4', 'video/webm']
const evidenceShortTypes = ['MOV', 'MP4', 'WEBM']

export const acceptedFileTypes = [...acceptedFiles, ...evidenceMimeTypes]
export const acceptedFileTypesShort = [...acceptedShort, ...evidenceShortTypes]
