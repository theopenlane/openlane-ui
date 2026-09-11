import { type TUploadedFile } from './types'

export const getExistingFileIds = (files: TUploadedFile[]): string[] => files.flatMap((file) => (file.type === 'existingFile' && file.id ? [String(file.id)] : []))

export const getNewFiles = (files: TUploadedFile[]): File[] => files.flatMap((file) => (file.type === 'file' && file.file ? [file.file] : []))
