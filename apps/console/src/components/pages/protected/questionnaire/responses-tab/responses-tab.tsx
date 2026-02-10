'use client'

import { useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportToCSV } from '@/utils/exportToCSV'
import { formatDate } from '@/utils/date'
import { extractQuestions } from './extract-questions'

type ResponseNode = {
  id: string
  email: string
  completedAt?: string | null
  document?: { id: string; data: unknown } | null
}

type ResponsesTabProps = {
  responses: ResponseNode[]
  jsonconfig: unknown
}

const PAGE_SIZE = 10

const renderAnswer = (value: unknown): string => {
  if (value == null) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export const ResponsesTab = ({ responses, jsonconfig }: ResponsesTabProps) => {
  const questions = useMemo(() => extractQuestions(jsonconfig), [jsonconfig])
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)

  const completedResponses = useMemo(() => responses.filter((r) => r.document?.data), [responses])

  const filteredResponses = useMemo(() => {
    return completedResponses.filter((response) => {
      const data = (response.document?.data || {}) as Record<string, unknown>
      return Object.entries(columnFilters).every(([questionName, filterValue]) => {
        if (!filterValue) return true
        const answer = renderAnswer(data[questionName])
        return answer.toLowerCase().includes(filterValue.toLowerCase())
      })
    })
  }, [completedResponses, columnFilters])

  const totalPages = Math.ceil(filteredResponses.length / PAGE_SIZE)
  const paginatedResponses = filteredResponses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleFilterChange = (questionName: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [questionName]: value }))
    setPage(0)
  }

  const handleExport = () => {
    if (!completedResponses.length || !questions.length) return
    const columns = [
      { label: 'Respondent', accessor: (r: ResponseNode) => r.email },
      { label: 'Completed', accessor: (r: ResponseNode) => r.completedAt || '' },
      ...questions.map((q) => ({
        label: q.title,
        accessor: (r: ResponseNode) => {
          const data = (r.document?.data || {}) as Record<string, unknown>
          return renderAnswer(data[q.name])
        },
      })),
    ]
    exportToCSV(completedResponses, columns, 'questionnaire_responses')
  }

  if (!questions.length) {
    return <p className="text-sm text-muted-foreground py-4">No questions found in this questionnaire.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completedResponses.length} response{completedResponses.length !== 1 ? 's' : ''}
        </p>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!completedResponses.length}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Respondent</TableHead>
              <TableHead className="min-w-[140px]">Completed</TableHead>
              {questions.map((q) => (
                <TableHead key={q.name} className="min-w-[200px]">
                  {q.title}
                </TableHead>
              ))}
            </TableRow>
            <TableRow>
              <TableHead>
                <Input placeholder="Filter..." className="h-7 text-xs" onChange={(e) => handleFilterChange('__email', e.target.value)} value={columnFilters['__email'] || ''} />
              </TableHead>
              <TableHead />
              {questions.map((q) => (
                <TableHead key={`filter-${q.name}`}>
                  <Input placeholder="Filter..." className="h-7 text-xs" onChange={(e) => handleFilterChange(q.name, e.target.value)} value={columnFilters[q.name] || ''} />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResponses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={questions.length + 2} className="text-center text-muted-foreground py-8">
                  No responses yet
                </TableCell>
              </TableRow>
            ) : (
              paginatedResponses.map((response) => {
                const data = (response.document?.data || {}) as Record<string, unknown>
                return (
                  <TableRow key={response.id}>
                    <TableCell className="font-medium">{response.email}</TableCell>
                    <TableCell>{formatDate(response.completedAt)}</TableCell>
                    {questions.map((q) => (
                      <TableCell key={q.name}>{renderAnswer(data[q.name])}</TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
