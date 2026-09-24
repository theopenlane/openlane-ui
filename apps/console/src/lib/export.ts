'use client'

import { downloadFile } from '@/utils/downloadFile'

type TExportCSV = {
  filename: string
}

export const fetchExampleCSV = async ({ filename }: TExportCSV): Promise<string> => {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename }),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch CSV')
  }

  return response.text()
}

export const exportCSV = async (arg: TExportCSV): Promise<void> => {
  const text = await fetchExampleCSV(arg)
  downloadFile([text], `${arg.filename}.csv`, 'text/csv')
}
