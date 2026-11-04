'use client'
import React from 'react'
import { useGetStandardDetails } from '@/lib/graphql-hooks/standard'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { TextCursorInput, Hammer, BookKey, FileStack, Link, Tag, Shapes, Building2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableRow } from '@repo/ui/table'
import { standardDetailsStyles } from './standard-details-card-styles'
import StandardChip from './shared/standard-chip'
import TagChip from '@/components/shared/tag-chip.tsx/tag-chip'
import { formatDate } from '@/utils/date'
import { ExternalLinkValue } from '@/components/shared/external-link/external-link-value'
import { isCustomStandard } from './custom-framework/custom-framework'

const icons = {
  shortName: TextCursorInput,
  governingBody: Hammer,
  framework: BookKey,
  version: FileStack,
  revision: FileStack,
  link: Link,
  tags: Tag,
  category: Shapes,
  owner: Building2,
}

type TStandardDetailsCardProps = {
  standardId: string
}

const StandardDetailsCard: React.FC<TStandardDetailsCardProps> = ({ standardId }) => {
  const { data, isLoading, error } = useGetStandardDetails(standardId)
  const { card, cardContent, tableCell, valueCell, tagsWrapper, icon } = standardDetailsStyles()

  if (isLoading) return <div>Loading...</div>
  if (error || !data?.standard) return <div>Error loading details.</div>

  const standard = data.standard

  const details = [
    { label: 'Short name', value: standard.shortName, icon: icons.shortName },
    { label: 'Governing body', value: standard.governingBody, icon: icons.governingBody },
    { label: 'Framework', value: standard.framework, icon: icons.framework },
    { label: 'Category', value: standard.standardType, icon: icons.category },
    { label: 'Version', value: standard.version, icon: icons.version },
    { label: 'Revision', value: standard.revision, icon: icons.revision },
    { label: 'Last Updated', value: formatDate(standard.updatedAt), icon: icons.revision },
    { label: 'Owner', value: isCustomStandard(standard) ? 'Your organization' : 'Openlane', icon: icons.owner },
  ]

  return (
    <>
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
                  <TableCell className={valueCell()}>{label === 'Short name' ? <StandardChip referenceFramework={standard.shortName ?? ''} /> : value}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className={tableCell()}>
                  <icons.link size={16} className={icon()} />
                  Link
                </TableCell>
                <TableCell className={valueCell()}>
                  <ExternalLinkValue value={standard.link} fallback="-" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className={tableCell()}>
                  <icons.tags size={16} className={icon()} />
                  Tags
                </TableCell>
                <TableCell className={valueCell()}>
                  <div className={tagsWrapper()}>
                    {standard.tags?.map((tag: string, i) => (
                      <TagChip tag={tag} key={i} />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}

export default StandardDetailsCard
