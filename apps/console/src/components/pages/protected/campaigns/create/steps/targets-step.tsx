'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Button } from '@repo/ui/button'
import { Trash2 } from 'lucide-react'
import MultipleSelector, { type Option } from '@repo/ui/multiple-selector'
import { isValidEmail } from '@/lib/validators'

export interface CampaignTargetEntry {
  email: string
  fullName: string
}

interface TargetsStepProps {
  targets: CampaignTargetEntry[]
  onTargetsChange: (targets: CampaignTargetEntry[]) => void
  uploadedFile: File | null
  onFileUpload: (file: File | null) => void
}

export const TargetsStep: React.FC<TargetsStepProps> = ({ targets, onTargetsChange, uploadedFile, onFileUpload }) => {
  const [activeTab, setActiveTab] = useState('csv')

  const handleFileUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      onFileUpload(uploaded.file)
    }
  }

  const selectedOptions: Option[] = useMemo(() => targets.map((t) => ({ value: t.email, label: t.email })), [targets])

  const handleChange = useCallback(
    (options: Option[]) => {
      onTargetsChange(options.map((o) => ({ email: o.value, fullName: '' })))
    },
    [onTargetsChange],
  )

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="csv">Upload CSV</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="saved">Saved List</TabsTrigger>
      </TabsList>

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
            <FileUpload onFileUpload={handleFileUpload} maxFileSizeInMb={3} acceptedFileTypes={['text/csv', 'application/vnd.ms-excel']} acceptedFileTypesShort={['.csv', '.xls']} multipleFiles={false} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="manual" className="mt-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Enter emails</label>
          <MultipleSelector
            value={selectedOptions}
            onChange={handleChange}
            creatable
            placeholder="Type an email and press Enter..."
            hidePlaceholderWhenSelected
            hideClearAllButton
            className="h-[400px] items-start overflow-y-auto"
            commandProps={{
              filter: (value: string, search: string) => {
                return isValidEmail(search) && value.toLowerCase().includes(search.toLowerCase()) ? 1 : -1
              },
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="saved" className="mt-4">
        <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-border rounded-md">Saved lists will be available in a future update.</div>
      </TabsContent>
    </Tabs>
  )
}
