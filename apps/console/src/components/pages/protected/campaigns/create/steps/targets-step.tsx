'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Plus, Trash2 } from 'lucide-react'

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

  const handleAddManualTarget = () => {
    onTargetsChange([...targets, { email: '', fullName: '' }])
  }

  const handleUpdateTarget = (index: number, field: keyof CampaignTargetEntry, value: string) => {
    const updated = [...targets]
    updated[index] = { ...updated[index], [field]: value }
    onTargetsChange(updated)
  }

  const handleRemoveTarget = (index: number) => {
    onTargetsChange(targets.filter((_, i) => i !== index))
  }

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
        <div className="flex flex-col gap-3">
          {targets.map((target, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input placeholder="Full name" value={target.fullName} onChange={(e) => handleUpdateTarget(index, 'fullName', e.target.value)} className="flex-1" />
              <Input placeholder="Email address" value={target.email} onChange={(e) => handleUpdateTarget(index, 'email', e.target.value)} className="flex-1" />
              <Button variant="icon" onClick={() => handleRemoveTarget(index)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button variant="secondary" icon={<Plus size={16} />} iconPosition="left" onClick={handleAddManualTarget} className="w-fit">
            Add Recipient
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="saved" className="mt-4">
        <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-border rounded-md">Saved lists will be available in a future update.</div>
      </TabsContent>
    </Tabs>
  )
}
