'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standards'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { ExternalLink, TextCursorInput, Hammer, BookKey, FileStack, Link, Tag } from 'lucide-react'
import { Table, TableBody, TableCell, TableRow } from '@repo/ui/table'
import { standardDetailsStyles } from './standard-details-card-styles'

const icons = {
  shortName: TextCursorInput,
  governingBody: Hammer,
  framework: BookKey,
  version: FileStack,
  revision: FileStack,
  link: Link,
  tags: Tag,
}

const StandardDetailsCard = () => {
  const { id } = useParams()
  const { data, isLoading, error } = useGetStandardDetails(id as string)
  const { card, cardContent, tableCell, valueCell, tagsWrapper, icon } = standardDetailsStyles()

  if (isLoading) return <div>Loading...</div>
  if (error || !data?.standard) return <div>Error loading details.</div>

  const standard = data.standard

  const details = [
    { label: 'Short name', value: standard.shortName, icon: icons.shortName },
    { label: 'Governing body', value: standard.standardType, icon: icons.governingBody },
    { label: 'Framework', value: standard.framework, icon: icons.framework },
    { label: 'Version', value: standard.version, icon: icons.version },
    { label: 'Revision', value: standard.revision, icon: icons.revision },
  ]

  return (
    <Card className={card()}>
      <CardContent className={cardContent()}>
        <Table>
          <TableBody>
            {details.map(({ label, value, icon: Icon }) => (
              <TableRow key={label}>
                <TableCell className={tableCell()}>
                  {Icon && <Icon size={16} className={icon()} />}
                  {label}
                </TableCell>
                <TableCell className={valueCell()}>{value}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className={tableCell()}>
                <icons.link size={16} className={icon()} />
                Link
              </TableCell>
              <TableCell className={valueCell()}>
                <a href={standard?.link ?? '#'} className="flex items-center gap-1 text-blue-500">
                  View <ExternalLink size={16} />
                </a>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className={tableCell()}>
                <icons.tags size={16} className={icon()} />
                Tags
              </TableCell>
              <TableCell className={valueCell()}>
                <div className={tagsWrapper()}>
                  {standard.tags?.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="whitespace-nowrap">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default StandardDetailsCard
