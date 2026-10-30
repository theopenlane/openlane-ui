'use client'

import React, { useCallback, useMemo } from 'react'
import { type UseFormReturn, useWatch } from 'react-hook-form'
import { Panel } from '@repo/ui/panel'
import { TableKeyEnum } from '@repo/ui/table-key'
import { FileOrderField, OrderDirection, type FileWhereInput } from '@repo/codegen/src/schema'
import { DocumentsSection } from '@/components/shared/documents-section/documents-section'
import { DocumentsCreateSection } from '@/components/shared/documents-section/documents-create-section'
import { toFileUploadArgs, type StagedUpload } from '@/components/shared/documents-section/staged-upload'
import ExistingFilesTable from '@/components/shared/file-upload/existing-files-table'
import CollapsibleSection from '@/components/shared/collapsible-section/collapsible-section'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import { useGetRemediationFilesPaginated, useRemediationFileIds, useUpdateRemediation, useUploadRemediationFiles } from '@/lib/graphql-hooks/remediation'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { type RemediationFormData } from '../hooks/use-form-schema'

type TRemediationDocumentsSectionProps = {
  form: UseFormReturn<RemediationFormData>
  isEditing: boolean
  remediationId?: string
}

const AttachExistingFiles: React.FC<{ form: UseFormReturn<RemediationFormData>; remediationId: string }> = ({ form, remediationId }) => {
  const selectedFileIds = useWatch({ control: form.control, name: 'fileIDs' }) ?? []
  const { data: linkedFileIds, isPending: isLoadingLinkedFileIds } = useRemediationFileIds(remediationId)
  const where = useMemo<FileWhereInput | undefined>(() => (linkedFileIds?.length ? { idNotIn: linkedFileIds } : undefined), [linkedFileIds])

  const setSelected = (fileIds: string[]) => form.setValue('fileIDs', fileIds, { shouldDirty: true })

  return (
    <CollapsibleSection label={selectedFileIds.length > 0 ? `Attach existing files (${pluralizeWithCount(selectedFileIds.length, 'file')} selected)` : 'Attach existing files'}>
      {isLoadingLinkedFileIds ? (
        <TableSkeleton />
      ) : (
        <ExistingFilesTable
          tableKey={TableKeyEnum.EXISTING_FILES}
          selectedFileIds={selectedFileIds}
          onSelect={(file) => setSelected([...(form.getValues('fileIDs') ?? []), file.id])}
          onDeselect={(fileId) => setSelected((form.getValues('fileIDs') ?? []).filter((id) => id !== fileId))}
          where={where}
        />
      )}
    </CollapsibleSection>
  )
}

const LinkedFiles: React.FC<{ remediationId: string; isEditing: boolean }> = ({ remediationId, isEditing }) => {
  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.REMEDIATION_FILES)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.REMEDIATION_FILES, FileOrderField, [{ field: FileOrderField.created_at, direction: OrderDirection.DESC }])
  const { successNotification, errorNotification } = useNotification()
  const { files, isLoading, isError, pageInfo, totalCount } = useGetRemediationFilesPaginated({ remediationId, orderBy, pagination })
  const { mutateAsync: updateRemediation } = useUpdateRemediation()
  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadRemediationFiles()

  if (!isEditing && !isLoading && !isError && !totalCount) {
    return null
  }

  const handleUpload = async (uploads: StagedUpload[]) => {
    const { files: remediationFiles, metadata: remediationFilesMetadata } = toFileUploadArgs(uploads)
    try {
      await uploadFiles({ updateRemediationId: remediationId, input: {}, remediationFiles, remediationFilesMetadata })
      successNotification({ title: 'Documents uploaded', description: 'The documents have been uploaded to this remediation.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
      throw error
    }
  }

  const handleRemoveFile = async (fileId: string) => {
    try {
      await updateRemediation({ updateRemediationId: remediationId, input: { removeFileIDs: [fileId] } })
      successNotification({ title: 'Document removed', description: 'The document has been removed from this remediation.' })
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <DocumentsSection
      parentId={remediationId}
      editAllowed={isEditing}
      tableKey={TableKeyEnum.REMEDIATION_FILES}
      files={files}
      isLoading={isLoading}
      isError={isError}
      pageInfo={pageInfo}
      totalCount={totalCount}
      pagination={pagination}
      onPaginationChange={setPagination}
      defaultSorting={orderBy}
      onSortChange={setOrderBy}
      upload={isEditing ? { onUpload: handleUpload, isUploading } : undefined}
      onRemoveFile={handleRemoveFile}
    />
  )
}

const CreateDocuments: React.FC<{ form: UseFormReturn<RemediationFormData> }> = ({ form }) => {
  const { setValue } = form
  const setUploads = useCallback((files: File[]) => setValue('uploads', files, { shouldDirty: true }), [setValue])
  const setFileIds = useCallback((fileIds: string[]) => setValue('fileIDs', fileIds, { shouldDirty: true }), [setValue])

  return <DocumentsCreateSection className="mt-0" onFilesChange={setUploads} onFileIdsChange={setFileIds} />
}

const RemediationDocumentsSection: React.FC<TRemediationDocumentsSectionProps> = ({ form, isEditing, remediationId }) => {
  const linkedFiles = remediationId ? <LinkedFiles remediationId={remediationId} isEditing={isEditing} /> : null

  if (!isEditing) {
    return linkedFiles ? <Panel className="p-4 empty:hidden">{linkedFiles}</Panel> : null
  }

  if (!remediationId) {
    return (
      <Panel className="p-4">
        <CreateDocuments form={form} />
      </Panel>
    )
  }

  return (
    <Panel className="p-4 flex flex-col gap-4">
      {linkedFiles}
      <AttachExistingFiles form={form} remediationId={remediationId} />
    </Panel>
  )
}

export default RemediationDocumentsSection
