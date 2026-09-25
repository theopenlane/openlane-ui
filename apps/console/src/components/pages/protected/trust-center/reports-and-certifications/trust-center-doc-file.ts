import { canOpenFilePreviewDialog } from '@/components/shared/file-preview/preview-mime'
import type { TFileActionsRow } from '@/components/shared/file-table/file-actions-column'

type TTrustCenterDocFiles<T extends TFileActionsRow> = { file?: T | null; originalFile?: T | null }

export const getTrustCenterDocAttachedFile = <T extends TFileActionsRow>({ file, originalFile }: TTrustCenterDocFiles<T>): T | null => file ?? originalFile ?? null

export const getTrustCenterDocPreviewFile = <T extends TFileActionsRow>({ file, originalFile }: TTrustCenterDocFiles<T>): T | null =>
  [file, originalFile].find((candidate): candidate is T => !!candidate && canOpenFilePreviewDialog(candidate)) ?? null
