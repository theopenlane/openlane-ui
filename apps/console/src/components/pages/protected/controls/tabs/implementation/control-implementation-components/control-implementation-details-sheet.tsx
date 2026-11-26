import React, { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useGetControlImplementationById } from '@/lib/graphql-hooks/control-implementation'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { SlideoutPreviewHeader } from '@/components/shared/crud-base/slideout-preview-header'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { RelatedControlsCell } from '@/components/shared/crud-base/columns/related-controls-cell'
import { getControlImplementationTitle, sortByRefCode } from '@/utils/control-implementation'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { ControlImplementationCard } from './control-implementation-card'
import useFormSchema from './form/use-form-schema'

type Props = {
  queryParamKey?: string
  entityId?: string | null
  onClose?: () => void
}

const ControlImplementationDetailsSheet: React.FC<Props> = ({ queryParamKey = 'controlImplementationId', entityId: entityIdProp, onClose: onCloseProp }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = entityIdProp !== undefined ? entityIdProp : searchParams.get(queryParamKey)

  const { data: node, isLoading, isError } = useGetControlImplementationById(entityId)
  const { form } = useFormSchema()
  const title = getControlImplementationTitle(node)
  const controlEdges = useMemo(() => node && sortByRefCode(node.controls), [node])
  const subcontrolEdges = useMemo(() => node && sortByRefCode(node.subcontrols).map(({ node: subcontrol }) => ({ node: { ...subcontrol, controlID: subcontrol.control.id } })), [node])

  const handleClose = () => {
    if (onCloseProp) {
      onCloseProp()
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  return (
    <GenericDetailsSheet
      objectType={ObjectTypes.CONTROL_IMPLEMENTATION}
      form={form}
      entityId={entityId}
      data={node}
      isFetching={isLoading}
      getName={() => null}
      onClose={handleClose}
      renderHeader={({ close }) => <SlideoutPreviewHeader title={title} close={close} fullPagePath={node ? getHrefForObjectType('controlImplementations', { id: node.id }) : null} />}
      overrideContent={
        node ? (
          <div className="mt-4 space-y-6">
            <ControlImplementationCard obj={node} />
            <section className="space-y-2">
              <h3 className="text-sm font-medium">Linked Controls</h3>
              <RelatedControlsCell controlEdges={controlEdges} subcontrolEdges={subcontrolEdges} />
            </section>
          </div>
        ) : (
          <EmptyTabState description={isError ? 'This control implementation could not be loaded.' : 'Control implementation not found.'} />
        )
      }
    />
  )
}

export default ControlImplementationDetailsSheet
