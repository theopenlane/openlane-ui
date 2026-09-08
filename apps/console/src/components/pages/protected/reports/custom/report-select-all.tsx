'use client'

import React from 'react'
import { Button } from '@repo/ui/button'

type TReportSelectAllProps = {
  allSelected: boolean
  disabled: boolean
  onToggle: () => void
}

const ReportSelectAll: React.FC<TReportSelectAllProps> = ({ allSelected, disabled, onToggle }) => (
  <Button type="button" variant="link" size="sm" onClick={onToggle} disabled={disabled}>
    {allSelected ? 'Deselect all' : 'Select all'}
  </Button>
)

export default ReportSelectAll
