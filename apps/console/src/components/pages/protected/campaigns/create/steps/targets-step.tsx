'use client'

import React, { useCallback, useMemo, type Dispatch, type SetStateAction } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Button } from '@repo/ui/button'
import { Trash2 } from 'lucide-react'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { isValidEmail } from '@/lib/validators'
import { PersonnelSelector } from './targets/personnel-selector'
import { ContactsSelector } from './targets/contacts-selector'
import { mergeTargets, type CampaignTargetEntry, type TargetTab } from './targets/target-entry'

interface TargetsStepProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: Dispatch<SetStateAction<CampaignTargetEntry[]>>
  uploadedFile: File | null
  onFileUpload: (file: File | null) => void
  activeTab: TargetTab
  onActiveTabChange: (tab: TargetTab) => void
}

export const TargetsStep: React.FC<TargetsStepProps> = ({ targets, onTargetsChange, uploadedFile, onFileUpload, activeTab, onActiveTabChange }) => {
  const manualOptions: Option[] = useMemo(() => targets.filter((target) => target.source === 'manual').map((target) => ({ value: target.email, label: target.email })), [targets])

  const handleFileUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      onFileUpload(uploaded.file)
    }
  }

  const handleManualChange = useCallback(
    (options: Option[]) => {
      const keptTargets = targets.filter((target) => target.source !== 'manual')
      const manualTargets: CampaignTargetEntry[] = options.filter((option) => isValidEmail(option.value.trim())).map((option) => ({ email: option.value.trim(), fullName: '', source: 'manual' }))
      onTargetsChange(mergeTargets(keptTargets, manualTargets))
    },
    [targets, onTargetsChange],
  )

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={(tab) => onActiveTabChange(tab as TargetTab)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="csv">Upload CSV</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="personnel" className="mt-4">
          <PersonnelSelector targets={targets} onTargetsChange={onTargetsChange} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-4">
          <ContactsSelector targets={targets} onTargetsChange={onTargetsChange} />
        </TabsContent>

        <TabsContent value="csv" className="mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Upload (CSV)</label>
            {uploadedFile ? (
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <span className="text-sm">{uploadedFile.name}</span>
                <Button variant="icon" onClick={() => onFileUpload(null)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ) : (
              <FileUpload
                onFileUpload={handleFileUpload}
                maxFileSizeInMb={3}
                acceptedFileTypes={['text/csv', 'application/vnd.ms-excel']}
                acceptedFileTypesShort={['.csv', '.xls']}
                multipleFiles={false}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Enter emails</label>
            <MultipleSelector
              value={manualOptions}
              onChange={handleManualChange}
              creatable
              placeholder="Type an email and press Enter..."
              hidePlaceholderWhenSelected
              hideClearAllButton
              className="h-80 items-start overflow-y-auto"
              commandProps={{
                filter: (value: string, search: string) => {
                  return isValidEmail(search) && value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1
                },
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
