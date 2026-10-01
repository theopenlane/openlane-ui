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
  'data-testid'?: string
}

const ExportMenuItem: React.FC<TExportMenuItemProps> = ({ onExport, onSelected, isExporting, disabled, label = 'Export', icon, 'data-testid': testId }) => (
  <MenuItem
    data-testid={testId}
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
