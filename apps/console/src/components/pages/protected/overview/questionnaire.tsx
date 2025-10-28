import React from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
// import { Badge } from '@repo/ui/badge'
import { FileQuestion } from 'lucide-react'
// import { ProgressCircle } from '@repo/ui/progress-circle'
import { Template } from '@repo/codegen/src/schema'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import Link from 'next/link'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { useMemo, useState } from 'react'
import { VisibilityState } from '@tanstack/table-core'
import { getQuestionnaireColumns } from './questionnaire-table-config'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'

const Questionnaire = () => {
  const { data } = useTemplates({})
  const templates = useMemo(() => (data?.templates?.edges?.map((edge) => edge?.node) as Template[]) || [], [data?.templates?.edges])
  const hasData = !!templates.length

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false,
  })

  const userIds = useMemo(() => {
    if (!templates) return []
    const ids = new Set<string>()
    templates.forEach((template) => {
      if (template.createdBy) ids.add(template.createdBy)
      if (template.updatedBy) ids.add(template.updatedBy)
    })
    return Array.from(ids)
  }, [templates])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const { columns, mappedColumns } = useMemo(() => getQuestionnaireColumns({ userMap }), [userMap])

  const questionnaireContent = (
    <CardContent>
      {/* <div className="flex gap-6 items-center mb-6">
        <ProgressCircle radius={65} strokeWidth={20} value={templates.length} max={50} variant="success" />
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">24</div>
            <Badge className="bg-gray-500 text-white">Created</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">10</div>
            <Badge className="bg-yellow-500 text-white">Outstanding</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">14</div>
            <Badge className="bg-green-500 text-white">Completed</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">2</div>
            <Badge className="bg-green-600 text-white">Completed Pending Review</Badge>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl font-medium">1</div>
            <Badge className="bg-green-600 text-white">Completed Accepted</Badge>
          </div>
        </div>
      </div> */}
      <DataTable columns={columns} data={templates} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} loading={fetchingUsers} />
    </CardContent>
  )

  return (
    <Card className="shadow-md rounded-lg flex-1">
      <div className="flex justify-between items-center pr-6">
        <CardTitle className="text-lg font-semibold">Questionnaire</CardTitle>
        {mappedColumns && <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} />}
      </div>
      {hasData ? (
        questionnaireContent
      ) : (
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center py-16">
            <FileQuestion width={45} height={45} strokeWidth={1} className="text-border mb-4" />
            <h2 className="text-lg font-semibold">No questionnaires</h2>
            <Link href={'/questionnaires'}>
              <Button variant="secondary" className="mt-4">
                Take me there
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default Questionnaire
