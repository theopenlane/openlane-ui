'use client'

import React, { useMemo } from 'react'
import { AuditLog } from '@repo/codegen/src/schema.ts'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import LogCard from '@/components/pages/protected/organization/logs/log-card.tsx'

type TLogCardsProps = {
  logs: AuditLog[]
  loading: boolean
}

const LogCards: React.FC<TLogCardsProps> = ({ logs, loading }: TLogCardsProps) => {
  const updatedByIds = logs.map((log) => log.updatedBy).filter((id): id is string => typeof id === 'string')
  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: updatedByIds }] } })

  const memoizedLogCards = useMemo(() => {
    return logs.map((log, index) => {
      const user = users.find((item) => item.id === log.updatedBy)
      return <LogCard key={index} log={log} user={user} />
    })
  }, [logs, users])

  if (loading) {
    return <p>Loading logs...</p>
  }

  return <div className="flex flex-wrap gap-2">{logs.length > 0 ? memoizedLogCards : <p className="">Select table filter to load logs.</p>}</div>
}

export default LogCards
