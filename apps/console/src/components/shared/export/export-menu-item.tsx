import React from 'react'
import { DownloadIcon, LoaderCircle } from 'lucide-react'
import MenuItem from '@/components/shared/menu/menu-item'

type TExportMenuItemProps = {
  onExport: () => void
  onSelected?: () => void
  isExporting?: boolean
  disabled?: boolean
  label?: string
  icon?: React.ReactNode
}

const ExportMenuItem: React.FC<TExportMenuItemProps> = ({ onExport, onSelected, isExporting, disabled, label = 'Export', icon }) => (
  <MenuItem
    icon={isExporting ? <LoaderCircle size={16} strokeWidth={2} className="animate-spin" /> : (icon ?? <DownloadIcon size={16} strokeWidth={2} />)}
    disabled={disabled || isExporting}
    onSelect={() => {
      onExport()
      onSelected?.()
    }}
  >
    {label}
  </MenuItem>
)

export default ExportMenuItem
