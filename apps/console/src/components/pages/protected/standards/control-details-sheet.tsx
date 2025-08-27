'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useGetControlById } from '@/lib/graphql-hooks/controls'
import { controlIconsMap } from '../controls/properties-card'
import { LinkIcon, PanelRightClose } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import ControlChip from '../controls/map-controls/shared/control-chip'
import { useGetMappedControls } from '@/lib/graphql-hooks/mapped-control'
import { GroupedControls, RelatedNode } from '../controls/related-controls'
import { RelatedControlChip } from '../controls/shared/related-control-chip'
import AccordionInfo from './control-details-accordion-info'

const ControlDetailsSheet = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plateEditorHelper = usePlateEditor()
  const { errorNotification, successNotification } = useNotification()

  const controlId = searchParams.get('controlId')
  const open = Boolean(controlId)

  const { data } = useGetControlById(controlId)

  const where = {
    or: [{ hasFromControlsWith: [{ id: controlId }] }, { hasToControlsWith: [{ id: controlId }] }],
  }

  const { data: mappedControlsData } = useGetMappedControls({ where, enabled: !!controlId })

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('controlId')
      router.replace(`?${newParams.toString()}`, { scroll: false })
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?controlId=${controlId}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        successNotification({
          title: 'Link copied to clipboard',
        })
      })
      .catch(() => {
        errorNotification({
          title: 'Failed to copy link',
        })
      })
  }

  const grouped: GroupedControls = {}

  mappedControlsData?.mappedControls?.edges?.forEach((edge) => {
    const node = edge?.node
    if (!node) return

    const currentId = controlId

    const isFromControl = node?.fromControls?.edges?.some((e) => e?.node?.id === currentId)
    const isFromSub = node?.fromSubcontrols?.edges?.some((e) => e?.node?.id === currentId)
    const isToControl = node?.toControls?.edges?.some((e) => e?.node?.id === currentId)
    const isToSub = node?.toSubcontrols?.edges?.some((e) => e?.node?.id === currentId)

    const oppositeNodes: RelatedNode[] = []

    if (isFromControl || isFromSub) {
      oppositeNodes.push(
        ...(node?.toControls?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: 'Control',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  mappingType: node.mappingType,
                  relation: node.relation,
                }
              : null,
          )
          .filter(Boolean) as typeof oppositeNodes),
        ...(node?.toSubcontrols?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: 'Subcontrol',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  controlId: e.node.control.id,
                  mappingType: node.mappingType,
                  relation: node.relation,
                }
              : null,
          )
          .filter(Boolean) as typeof oppositeNodes),
      )
    } else if (isToControl || isToSub) {
      oppositeNodes.push(
        ...(node?.fromControls?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: 'Control',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  mappingType: node.mappingType,
                  relation: node.relation,
                }
              : null,
          )
          .filter(Boolean) as typeof oppositeNodes),
        ...(node?.fromSubcontrols?.edges
          ?.map((e) =>
            e?.node
              ? {
                  type: 'Subcontrol',
                  id: e.node.id,
                  refCode: e.node.refCode,
                  referenceFramework: e.node.referenceFramework,
                  controlId: e.node.control.id,
                  mappingType: node.mappingType,
                  relation: node.relation,
                }
              : null,
          )
          .filter(Boolean) as typeof oppositeNodes),
      )
    }

    oppositeNodes.forEach((n) => {
      const key = n.referenceFramework || 'CUSTOM'
      if (!grouped[key]) grouped[key] = []
      if (!grouped[key].some((existing) => existing.refCode === n.refCode)) {
        grouped[key].push(n)
      }
    })
  })

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="bg-card flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
        header={
          <SheetHeader>
            <div className="flex items-center justify-between">
              <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleOpenChange(false)} />
              <Button className="h-8 p-2" icon={<LinkIcon />} iconPosition="left" variant="outline" onClick={handleCopyLink}>
                Copy link
              </Button>
            </div>
          </SheetHeader>
        }
      >
        <SheetTitle className="text-2xl text-start">{data?.control.refCode}</SheetTitle>
        <div className="flex flex-col gap-8">
          {data?.control.description && <div className="mt-5">{plateEditorHelper.convertToReadOnly(data?.control.description as string)}</div>}
          <div className="flex flex-col gap-2.5">
            <p className="mb-1.5 text-xl">Properties</p>
            <Property label="Framework" value={data?.control.referenceFramework} />
            <Property label="Category" value={data?.control.category} />
            <Property label="Subcategory" value={data?.control.subcategory} />
            <Property label="Mapped categories" value={data?.control?.mappedCategories?.join(', ')} />
            <Property label="Type" value={data?.control.controlType?.toLowerCase()} />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="mb-1.5 text-xl">Subcontrols</p>
            {data?.control?.subcontrols?.edges?.length ? (
              <div className="flex gap-2 flex-wrap">
                {data.control.subcontrols.edges.map((edge) => {
                  if (!edge?.node) {
                    return null
                  }
                  return <ControlChip key={edge?.node?.id} control={edge?.node} hideStandard disableHref />
                })}
              </div>
            ) : (
              <div className="text-sm italic text-muted-foreground">No available subcontrols.</div>
            )}
          </div>

          <div>
            <p className="mb-5 text-xl">Related Controls</p>

            {Object.keys(grouped).length ? (
              Object.entries(grouped).map(([framework, nodes], index, array) => (
                <div key={framework} className={`mb-2 flex gap-5 items-center pb-2 ${index < array.length - 1 ? 'border-b' : ''}`}>
                  <h3 className="font-semibold min-w-24 text-text-informational text-xs">{framework}</h3>
                  <div className="flex gap-2.5 flex-wrap">
                    {nodes.map((node) => {
                      const href = node.type === 'Subcontrol' ? `/controls/${node.controlId}/${node.id}` : `/controls/${node.id}`
                      return <RelatedControlChip key={node.refCode} refCode={node.refCode} href={href} mappingType={node.mappingType} relation={node.relation} />
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm italic text-muted-foreground">No related controls found.</div>
            )}
          </div>

          <div>
            <AccordionInfo
              implementationGuidance={data?.control.implementationGuidance}
              exampleEvidence={data?.control.exampleEvidence}
              controlQuestions={data?.control.controlQuestions}
              assessmentMethods={data?.control.assessmentMethods}
              assessmentObjectives={data?.control.assessmentObjectives}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ControlDetailsSheet

const Property = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="grid grid-cols-[170px_1fr] items-start gap-x-3">
    <div className="flex items-start gap-2">
      <div className="pt-0.5">{controlIconsMap[label]}</div>
      <div className="text-sm">{label}</div>
    </div>
    <div className="text-sm whitespace-pre-line capitalize">{value || '-'}</div>
  </div>
)
