import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { DataTable } from '@repo/ui/data-table'
import { Button } from '@repo/ui/button'
import { FileQuestion } from 'lucide-react'
import { Template } from '@repo/codegen/src/schema'
import { useTemplates } from '@/lib/graphql-hooks/templates'
import Link from 'next/link'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { VisibilityState } from '@tanstack/table-core'
import { getQuestionnaireColumns } from './questionnaire-table-config'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'

const Questionnaire = () => {
  const { data } = useTemplates({})
  const templates = useMemo(() => (data?.templates?.edges?.map((edge) => edge?.node) as Template[]) || [], [data?.templates?.edges])
  const hasData = !!templates.length
  const defaultVisibility: VisibilityState = {
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.QUESTIONNAIRE_OVERVIEW, defaultVisibility))

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
      <DataTable
        columns={columns}
        data={templates}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        loading={fetchingUsers}
        tableKey={TableKeyEnum.QUESTIONNAIRE_OVERVIEW}
      />
    </CardContent>
  )

  return (
    <Card className="shadow-md rounded-lg flex-1">
      <div className="flex justify-between items-center pr-6">
        <CardTitle className="text-lg font-semibold">Questionnaire</CardTitle>
        {mappedColumns && (
          <ColumnVisibilityMenu
            mappedColumns={mappedColumns}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            storageKey={TableColumnVisibilityKeysEnum.QUESTIONNAIRE_OVERVIEW}
          />
        )}
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
