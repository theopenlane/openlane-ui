import React from 'react'
import { DownloadIcon, LoaderCircle } from 'lucide-react'

type TExportMenuItemProps = {
  onExport: () => void
  onSelected?: () => void
  isExporting?: boolean
  disabled?: boolean
  label?: string
}

const ExportMenuItem: React.FC<TExportMenuItemProps> = ({ onExport, onSelected, isExporting, disabled, label = 'Export' }) => (
  <button
    type="button"
    disabled={disabled || isExporting}
    className="flex items-center bg-transparent space-x-2 px-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    onClick={() => {
      onExport()
      onSelected?.()
    }}
  >
    {isExporting ? <LoaderCircle size={16} strokeWidth={2} className="animate-spin" /> : <DownloadIcon size={16} strokeWidth={2} />}
    <span>{label}</span>
  </button>
)

export default ExportMenuItem
