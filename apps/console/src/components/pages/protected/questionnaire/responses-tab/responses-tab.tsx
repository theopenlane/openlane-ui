'use client'

import { useEffect, useMemo, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import { Input } from '@repo/ui/input'
import Pagination from '@repo/ui/pagination'
import { Search } from 'lucide-react'
import { extractQuestions } from './extract-questions'
import { renderAnswer } from '../utils/render-answer'

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

export const ResponsesTab = ({ responses, jsonconfig }: ResponsesTabProps) => {
  const questions = useMemo(() => extractQuestions(jsonconfig), [jsonconfig])
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const completedResponses = useMemo(() => responses.filter((r) => r.document?.data), [responses])

  const filteredResponses = useMemo(() => {
    return completedResponses.filter((response) => {
      const data = (response.document?.data || {}) as Record<string, unknown>
      return Object.entries(columnFilters).every(([key, filterValue]) => {
        if (!filterValue) return true
        if (key === '__email') {
          return (response.email || '').toLowerCase().includes(filterValue.toLowerCase())
        }
        const answer = renderAnswer(data[key])
        return answer.toLowerCase().includes(filterValue.toLowerCase())
      })
    })
  }, [completedResponses, columnFilters])

  const totalPages = Math.max(1, Math.ceil(filteredResponses.length / pageSize))
  const paginatedResponses = filteredResponses.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleFilterChange = (questionName: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [questionName]: value }))
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  if (!questions.length) {
    return <p className="text-sm text-muted-foreground py-4">No questions found in this questionnaire.</p>
  }

  return (
    <div className="space-y-0">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px] align-top p-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search..." className="h-9 pl-9 text-sm bg-transparent" onChange={(e) => handleFilterChange('__email', e.target.value)} value={columnFilters['__email'] || ''} />
                  </div>
                  <div className="font-semibold text-sm leading-snug">Respondent</div>
                </div>
              </TableHead>
              {questions.map((q) => (
                <TableHead key={q.name} className="min-w-[200px] align-top p-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search..." className="h-9 pl-9 text-sm bg-transparent" onChange={(e) => handleFilterChange(q.name, e.target.value)} value={columnFilters[q.name] || ''} />
                    </div>
                    <div className="font-semibold text-sm leading-snug">{q.title}</div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResponses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={questions.length + 1} className="text-center text-muted-foreground py-8">
                  No responses yet
                </TableCell>
              </TableRow>
            ) : (
              paginatedResponses.map((response) => {
                const data = (response.document?.data || {}) as Record<string, unknown>
                return (
                  <TableRow key={response.id}>
                    <TableCell>{response.email}</TableCell>
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
      <Pagination currentPage={page} totalPages={totalPages} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
    </div>
  )
}
