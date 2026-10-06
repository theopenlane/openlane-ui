'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { StatusLine } from '@/components/shared/status-line/status-line'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useNotification } from '@/hooks/useNotification'
import { useSearchInternalPolicyDocuments, type TInternalPolicyDocument } from '@/lib/graphql-hooks/internal-policy'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type TPdfDocumentAttachment } from './pdf-document-type'
import { usePolicyPdfExport } from './use-policy-pdf-export'

type TPdfDocumentPolicyPickerProps = {
  budgetBytes: number
  onAttach: (attachment: TPdfDocumentAttachment) => void
  onCancel: () => void
}

const PolicyIcon = ObjectAssociationMap.policies.icon

const PdfDocumentPolicyPicker = ({ budgetBytes, onAttach, onCancel }: TPdfDocumentPolicyPickerProps) => {
  const { setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch()
  const { policies, totalCount, isFetching, isError } = useSearchInternalPolicyDocuments({ search: debouncedTerm })
  const [selectedPolicy, setSelectedPolicy] = useState<TInternalPolicyDocument | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const exportPolicyPdf = usePolicyPdfExport()
  const { errorNotification } = useNotification()

  useEffect(() => () => abortRef.current?.abort(), [])

  const isSearching = getIsSearching(isFetching)
  const emptyMessage = isError ? 'Could not load policies. Please try again later.' : 'No policies found.'

  const handleSelectedIdsChange = (ids: string[]) => setSelectedPolicy(policies.find((policy) => policy.id === ids[0]) ?? null)

  const handleAttach = async () => {
    if (!selectedPolicy) return
    const controller = new AbortController()
    abortRef.current = controller
    setIsExporting(true)
    try {
      onAttach(await exportPolicyPdf(selectedPolicy, budgetBytes, controller.signal))
    } catch (error) {
      if (controller.signal.aborted) return
      errorNotification({ title: 'Could not attach the policy', description: parseErrorMessage(error) })
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 whitespace-normal rounded-md border bg-card p-3">
      <p className="text-sm text-muted-foreground">The policy is exported to PDF and embedded in the questionnaire. Later changes to the policy are not reflected until you attach it again.</p>
      <SearchableItemSelect
        selectedIds={selectedPolicy ? [selectedPolicy.id] : []}
        onSelectedIdsChange={handleSelectedIdsChange}
        items={isSearching ? [] : policies}
        knownItems={selectedPolicy ? [selectedPolicy] : undefined}
        isLoading={isSearching}
        icon={<PolicyIcon className="h-4 w-4" />}
        placeholder="Select a policy..."
        searchPlaceholder="Search policies..."
        emptyMessage={emptyMessage}
        multiple={false}
        onSearchTextChange={setSearchText}
        renderItemEnd={(policy) => policy.revision && <span className="text-xs text-muted-foreground">{policy.revision}</span>}
      />
      {totalCount > policies.length && (
        <p className="text-xs text-muted-foreground">
          Showing {policies.length} of {totalCount} policies. Type to narrow the list.
        </p>
      )}
      {isExporting && <StatusLine>Exporting the policy to PDF. This can take up to a minute.</StatusLine>}
      <div className="flex justify-end gap-2">
        <CancelButton onClick={onCancel} />
        <Button variant="primary" onClick={handleAttach} disabled={!selectedPolicy || isExporting} loading={isExporting}>
          Attach policy
        </Button>
      </div>
    </div>
  )
}

export default PdfDocumentPolicyPicker
