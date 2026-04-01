'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  ConnectionLineType,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type ReactFlowInstance,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TriggerNode } from '@/components/workflows/trigger-node'
import { ConditionNode } from '@/components/workflows/condition-node'
import { ActionNode } from '@/components/workflows/action-node'
import { NodeEditPanel } from '@/components/workflows/node-edit-panel'
import { NodePalette } from '@/components/workflows/node-palette'
import type { WorkflowObjectTypeMetadata } from '@/lib/graphql-hooks/workflows'
import { Undo2, Redo2 } from 'lucide-react'
import { Button } from '@repo/ui/button'

type WorkflowVisualEditorProps = {
  triggers: Record<string, unknown>[]
  conditions: Record<string, unknown>[]
  actions: Record<string, unknown>[]
  objectTypes: WorkflowObjectTypeMetadata[]
  onUpdate?: (triggers: Record<string, unknown>[], conditions: Record<string, unknown>[], actions: Record<string, unknown>[]) => void
}

const NODE_X = 220
const NODE_GAP = 180
const GROUP_GAP = 70
const EDGE_TYPE = 'smoothstep'

const getNextNodePosition = (type: 'trigger' | 'condition' | 'action', nodes: Node[]) => {
  const triggerCount = nodes.filter((n) => n.type === 'trigger').length
  const conditionCount = nodes.filter((n) => n.type === 'condition').length
  const actionCount = nodes.filter((n) => n.type === 'action').length

  const groupCounts = {
    trigger: triggerCount,
    condition: conditionCount,
    action: actionCount,
  }

  const order: Array<'trigger' | 'condition' | 'action'> = ['trigger', 'condition', 'action']
  let yOffset = 30

  for (const group of order) {
    const count = groupCounts[group]
    if (group === type) {
      yOffset += count * NODE_GAP
      break
    }

    if (count > 0) {
      yOffset += count * NODE_GAP + GROUP_GAP
    }
  }

  return { x: NODE_X, y: yOffset }
}

function workflowToNodes(triggers: Record<string, unknown>[], conditions: Record<string, unknown>[], actions: Record<string, unknown>[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let yOffset = 30

  triggers.forEach((trigger, idx) => {
    nodes.push({
      id: `trigger-${idx}`,
      type: 'trigger',
      position: { x: NODE_X, y: yOffset },
      data: trigger,
    })

    if (conditions.length > 0) {
      edges.push({
        id: `trigger-${idx}-to-condition-0`,
        source: `trigger-${idx}`,
        target: `condition-0`,
        type: EDGE_TYPE,
      })
    } else if (actions.length > 0) {
      edges.push({
        id: `trigger-${idx}-to-action-0`,
        source: `trigger-${idx}`,
        target: `action-0`,
        type: EDGE_TYPE,
      })
    }

    yOffset += NODE_GAP
  })

  if (triggers.length > 0) {
    yOffset += GROUP_GAP
  }

  conditions.forEach((condition, idx) => {
    nodes.push({
      id: `condition-${idx}`,
      type: 'condition',
      position: { x: NODE_X, y: yOffset },
      data: condition,
    })

    if (idx < conditions.length - 1) {
      edges.push({
        id: `condition-${idx}-to-condition-${idx + 1}`,
        source: `condition-${idx}`,
        target: `condition-${idx + 1}`,
        label: 'true',
        labelStyle: { fill: '#10b981', fontWeight: 600 },
        labelBgStyle: { fill: '#fff' },
        type: EDGE_TYPE,
      })
    } else if (actions.length > 0) {
      edges.push({
        id: `condition-${idx}-to-action-0`,
        source: `condition-${idx}`,
        target: `action-0`,
        label: 'true',
        labelStyle: { fill: '#10b981', fontWeight: 600 },
        labelBgStyle: { fill: '#fff' },
        type: EDGE_TYPE,
      })
    }

    yOffset += NODE_GAP
  })

  if (conditions.length > 0) {
    yOffset += GROUP_GAP
  }

  actions.forEach((action, idx) => {
    nodes.push({
      id: `action-${idx}`,
      type: 'action',
      position: { x: NODE_X, y: yOffset },
      data: action,
    })

    if (idx < actions.length - 1) {
      edges.push({
        id: `action-${idx}-to-action-${idx + 1}`,
        source: `action-${idx}`,
        target: `action-${idx + 1}`,
        type: EDGE_TYPE,
      })
    }

    yOffset += NODE_GAP
  })

  return { nodes, edges }
}

export const WorkflowVisualEditor = ({ triggers, conditions, actions, objectTypes, onUpdate }: WorkflowVisualEditorProps) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => workflowToNodes(triggers, conditions, actions), [triggers, conditions, actions])

  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const isInternalUpdateRef = useRef(false)
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const defaultObjectType = objectTypes[0]?.type ?? 'Control'

  const saveHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push({ nodes: newNodes, edges: newEdges })
        return newHistory.slice(-20)
      })
      setHistoryIndex((prev) => Math.min(prev + 1, 19))
    },
    [historyIndex],
  )

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      isInternalUpdateRef.current = true
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds)
        saveHistory(newNodes, edges)
        return newNodes
      })
    },
    [setNodes, edges, saveHistory],
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds)
        saveHistory(nodes, newEdges)
        return newEdges
      })
    },
    [setEdges, nodes, saveHistory],
  )

  useEffect(() => {
    if (!onUpdate || !isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }

    const newTriggers = nodes.filter((n) => n.type === 'trigger').map((n) => n.data)
    const newConditions = nodes.filter((n) => n.type === 'condition').map((n) => n.data)
    const newActions = nodes.filter((n) => n.type === 'action').map((n) => n.data)

    onUpdate(newTriggers, newConditions, newActions)
    isInternalUpdateRef.current = false
  }, [nodes, onUpdate])

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      condition: ConditionNode,
      action: ActionNode,
    }),
    [],
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return

      const sourceNode = nodes.find((n) => n.id === connection.source)
      const targetNode = nodes.find((n) => n.id === connection.target)

      if (sourceNode?.type === 'action') {
        return
      }
      if (targetNode?.type === 'trigger') {
        return
      }

      setEdges((eds) => {
        const newEdges = addEdge(connection, eds)
        saveHistory(nodes, newEdges)
        return newEdges
      })
    },
    [setEdges, nodes, saveHistory],
  )

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      isInternalUpdateRef.current = true
      setNodes((nds) => {
        const newNodes = nds.map((node) => (node.id === nodeId ? { ...node, data } : node))
        saveHistory(newNodes, edges)
        return newNodes
      })
    },
    [setNodes, edges, saveHistory],
  )

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      isInternalUpdateRef.current = true
      setNodes((nds) => {
        const newNodes = nds.filter((n) => n.id !== nodeId)
        saveHistory(newNodes, edges)
        return newNodes
      })
      setEdges((eds) => {
        const newEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
        return newEdges
      })
    },
    [setNodes, setEdges, edges, saveHistory],
  )

  const handleAddNode = useCallback(
    (type: 'trigger' | 'condition' | 'action', position?: { x: number; y: number }) => {
      isInternalUpdateRef.current = true
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: position ?? getNextNodePosition(type, nodes),
        data:
          type === 'trigger'
            ? {
                operation: 'UPDATE',
                objectType: defaultObjectType,
                fields: [],
                edges: [],
                description: '',
                expression: 'true',
              }
            : type === 'condition'
              ? { expression: 'true', description: '' }
              : {
                  key: 'action',
                  type: 'REQUEST_APPROVAL',
                  description: '',
                  params: { targets: [], required: true, required_count: 1, label: '' },
                },
      }

      setNodes((nds) => {
        const newNodes = [...nds, newNode]
        saveHistory(newNodes, edges)
        return newNodes
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultObjectType, setNodes, nodes.length, edges, saveHistory],
  )

  const handleUndo = useCallback(() => {
    isInternalUpdateRef.current = true
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setNodes(prevState.nodes)
      setEdges(prevState.edges)
      setHistoryIndex((prev) => prev - 1)
    }
  }, [historyIndex, history, setNodes, setEdges])

  const handleRedo = useCallback(() => {
    isInternalUpdateRef.current = true
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setNodes(nextState.nodes)
      setEdges(nextState.edges)
      setHistoryIndex((prev) => prev + 1)
    }
  }, [historyIndex, history, setNodes, setEdges])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow') as 'trigger' | 'condition' | 'action'
      if (!type || !reactFlowInstance || !reactFlowWrapperRef.current) return

      const bounds = reactFlowWrapperRef.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      handleAddNode(type, position)
    },
    [reactFlowInstance, handleAddNode],
  )

  return (
    <>
      <div className="flex gap-4 h-[600px] w-full">
        <NodePalette onAddNode={handleAddNode} />

        <div ref={reactFlowWrapperRef} className="flex-1 border rounded-lg bg-background relative min-w-0 h-full">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button size="sm" variant="outline" onClick={handleUndo} disabled={historyIndex <= 0}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="w-full h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              snapToGrid={true}
              snapGrid={[15, 15]}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              defaultEdgeOptions={{ type: EDGE_TYPE }}
              connectionLineType={ConnectionLineType.SmoothStep}
              attributionPosition="bottom-left"
              onInit={setReactFlowInstance}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </div>

      <NodeEditPanel node={selectedNode} objectTypes={objectTypes} onClose={() => setSelectedNode(null)} onUpdate={handleNodeUpdate} onDelete={handleNodeDelete} />
    </>
  )
}
