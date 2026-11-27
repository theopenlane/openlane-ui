import { type ReactFlowProps } from '@xyflow/react'

export const STATIC_FLOW_PROPS = {
  fitView: false,
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: false,
  zoomOnScroll: false,
  zoomOnPinch: false,
  zoomOnDoubleClick: false,
  panOnScroll: false,
  panOnDrag: false,
  nodesFocusable: false,
  edgesFocusable: false,
  preventScrolling: false,
  proOptions: { hideAttribution: true },
} satisfies ReactFlowProps

export const STATIC_FLOW_HANDLE_CLASS = '!h-1 !w-1 !min-w-0 !border-0 !bg-transparent'

export const INTERACTIVE_NODE_STYLE: React.CSSProperties = { pointerEvents: 'all' }
