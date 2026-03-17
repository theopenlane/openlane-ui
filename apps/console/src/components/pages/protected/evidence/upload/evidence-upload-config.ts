import { acceptedFileTypes as acceptedFiles, acceptedFileTypesShort as acceptedShort } from '@/components/shared/file-upload/file-upload-config'

const evidenceMimeTypes = ['video/quicktime', 'video/mp4', 'video/webm']
const evidenceShortTypes = ['.mov', '.mp4', '.webm']

export const acceptedFileTypes = [...acceptedFiles, ...evidenceMimeTypes]
export const acceptedFileTypesShort = [...acceptedShort, ...evidenceShortTypes]
