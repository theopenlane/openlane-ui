'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useFetchWithRetry } from '@/lib/graphqlClient'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useNotification } from '@/hooks/useNotification'

const ENDPOINT = process.env.NEXT_PUBLIC_API_GQL_URL ?? ''

const INTROSPECTION_QUERY = `{
  __schema {
    queryType {
      fields {
        name
        type { name kind ofType { name kind ofType { name kind ofType { name kind } } } }
        args { name type { name kind ofType { name kind } } }
      }
    }
    types {
      name kind
      fields {
        name
        type { name kind ofType { name kind ofType { name kind } } }
      }
      enumValues { name }
    }
  }
}`

type GQLTypeRef = {
  name: string | null
  kind: string
  ofType?: GQLTypeRef | null
}

type GQLField = {
  name: string
  type: GQLTypeRef
}

type GQLType = {
  name: string
  kind: string
  fields: GQLField[] | null
  enumValues: { name: string }[] | null
}

type GQLQueryField = {
  name: string
  type: GQLTypeRef
  args: { name: string; type: GQLTypeRef }[]
}

type IntrospectionSchema = {
  queryType: { fields: GQLQueryField[] }
  types: GQLType[]
}

type ScalarKind = 'String' | 'ID' | 'Int' | 'Float' | 'Boolean' | 'ENUM'

type EntityField =
  | { kind: 'scalar'; name: string; scalarKind: ScalarKind }
  | { kind: 'object'; name: string; subFields: { name: string; scalarKind: ScalarKind }[] }

type EntityOption = {
  queryName: string
  displayName: string
  nodeTypeName: string
  fields: EntityField[]
}

type Operator = 'eq' | 'neq' | 'contains' | 'hasPrefix' | 'hasSuffix' | 'gt' | 'lt'

type Condition = {
  id: string
  field: string
  operator: Operator
  value: string
}

type Combinator = 'and' | 'or'

const OPERATOR_LABELS: Record<Operator, string> = {
  eq: 'equals',
  neq: 'does not equal',
  contains: 'contains',
  hasPrefix: 'starts with',
  hasSuffix: 'ends with',
  gt: 'greater than',
  lt: 'less than',
}

function unwrapType(type: GQLTypeRef | null | undefined): { name: string | null; kind: string } {
  if (!type) return { name: null, kind: 'SCALAR' }
  if (type.kind === 'NON_NULL' || type.kind === 'LIST') return unwrapType(type.ofType)
  return { name: type.name, kind: type.kind }
}

function operatorsForKind(kind: ScalarKind): Operator[] {
  if (kind === 'Int' || kind === 'Float') return ['eq', 'neq', 'gt', 'lt']
  if (kind === 'Boolean' || kind === 'ENUM') return ['eq', 'neq']
  return ['eq', 'neq', 'contains', 'hasPrefix', 'hasSuffix']
}

// Convert camelCase/PascalCase query names to human-readable labels
function toDisplayName(queryName: string): string {
  return queryName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function buildFieldList(fields: string[]): string {
  const flat: string[] = []
  const nested = new Map<string, string[]>()

  for (const f of fields) {
    const dot = f.indexOf('.')
    if (dot === -1) {
      flat.push(f)
    } else {
      const parent = f.slice(0, dot)
      const child = f.slice(dot + 1)
      if (!nested.has(parent)) nested.set(parent, [])
      nested.get(parent)!.push(child)
    }
  }

  const pad = '        '
  const innerPad = '          '
  const parts: string[] = [...flat]
  for (const [parent, children] of nested) {
    parts.push(`${parent} {\n${innerPad}${children.join(`\n${innerPad}`)}\n${pad}}`)
  }
  return parts.join(`\n${pad}`)
}

function buildGraphQLQuery(queryName: string, fields: string[], combinator: Combinator, conditions: Condition[]): string {
  const active = conditions.filter((c) => c.field && c.value !== '')

  const formatValue = (value: string): string => {
    if (/^[A-Z][A-Z0-9_]*$/.test(value)) return value
    if (value === 'true' || value === 'false') return value
    if (!isNaN(Number(value))) return value
    return `"${value}"`
  }

  let whereClause = ''
  if (active.length === 1) {
    const c = active[0]
    whereClause = `where: { ${c.field}: { ${c.operator}: ${formatValue(c.value)} } }`
  } else if (active.length > 1) {
    const parts = active.map((c) => `{ ${c.field}: { ${c.operator}: ${formatValue(c.value)} } }`)
    whereClause = `where: { ${combinator}: [${parts.join(', ')}] }`
  }

  const fieldList = buildFieldList(fields)
  const args = whereClause ? `(${whereClause})` : ''
  return `{
  ${queryName}${args} {
    totalCount
    edges {
      node {
        ${fieldList}
      }
    }
  }
}`
}

function buildEntities(schema: IntrospectionSchema): EntityOption[] {
  const typeMap = new Map<string, GQLType>()
  for (const t of schema.types) typeMap.set(t.name, t)

  const entities: EntityOption[] = []

  for (const field of schema.queryType.fields) {
    if (field.name.toLowerCase().includes('search')) continue

    const unwrapped = unwrapType(field.type)
    if (!unwrapped.name?.endsWith('Connection')) continue

    const connectionType = typeMap.get(unwrapped.name)
    if (!connectionType?.fields) continue

    const edgesField = connectionType.fields.find((f) => f.name === 'edges')
    if (!edgesField) continue

    const edgeTypeName = unwrapType(edgesField.type).name
    if (!edgeTypeName) continue

    const edgeType = typeMap.get(edgeTypeName)
    if (!edgeType?.fields) continue

    const nodeField = edgeType.fields.find((f) => f.name === 'node')
    if (!nodeField) continue

    const nodeTypeName = unwrapType(nodeField.type).name
    if (!nodeTypeName) continue

    const nodeType = typeMap.get(nodeTypeName)
    if (!nodeType?.fields) continue

    const entityFields: EntityField[] = []
    for (const f of nodeType.fields) {
      const u = unwrapType(f.type)
      if (u.kind === 'SCALAR') {
        entityFields.push({ kind: 'scalar', name: f.name, scalarKind: (u.name ?? 'String') as ScalarKind })
      } else if (u.kind === 'ENUM') {
        entityFields.push({ kind: 'scalar', name: f.name, scalarKind: 'ENUM' })
      } else if (u.kind === 'OBJECT' && u.name) {
        const relType = typeMap.get(u.name)
        if (relType?.fields) {
          const subFields: { name: string; scalarKind: ScalarKind }[] = []
          for (const sf of relType.fields) {
            const su = unwrapType(sf.type)
            if (su.kind === 'SCALAR') {
              subFields.push({ name: sf.name, scalarKind: (su.name ?? 'String') as ScalarKind })
            } else if (su.kind === 'ENUM') {
              subFields.push({ name: sf.name, scalarKind: 'ENUM' })
            }
          }
          if (subFields.length > 0) {
            entityFields.push({ kind: 'object', name: f.name, subFields })
          }
        }
      }
    }

    if (entityFields.length === 0) continue
    entities.push({ queryName: field.name, displayName: toDisplayName(field.name), nodeTypeName, fields: entityFields })
  }

  return entities.sort((a, b) => a.displayName.localeCompare(b.displayName))
}

function defaultSelectedFields(fields: EntityField[]): Set<string> {
  const defaults = new Set<string>()
  for (const f of fields) {
    if (f.kind === 'scalar' && (f.name === 'id' || f.name === 'name')) defaults.add(f.name)
  }
  if (defaults.size === 0) {
    const first = fields.find((f) => f.kind === 'scalar')
    if (first) defaults.add(first.name)
  }
  return defaults
}

type QueryResult = {
  totalCount: number
  rows: Record<string, unknown>[]
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean
  indeterminate: boolean
  onChange: () => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} className="rounded border-border accent-primary" />
}

export function QueryBuilderPage() {
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { errorNotification } = useNotification()
  const fetchWithRetry = useFetchWithRetry()

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Custom Report', href: '/reports/custom' },
    ])
  }, [setCrumbs])

  const {
    data: schema,
    isLoading: schemaLoading,
    error: schemaError,
  } = useQuery<IntrospectionSchema>({
    queryKey: ['introspection'],
    queryFn: async () => {
      const response = await fetchWithRetry(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: INTROSPECTION_QUERY }),
      })
      const json = await response.json()
      return json.data.__schema as IntrospectionSchema
    },
    staleTime: 5 * 60 * 1000,
  })

  const entities = schema ? buildEntities(schema) : []

  const [selectedEntityName, setSelectedEntityName] = useState<string>('')
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [expandedObjects, setExpandedObjects] = useState<Set<string>>(new Set())
  const [conditions, setConditions] = useState<Condition[]>([])
  const [combinator, setCombinator] = useState<Combinator>('and')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [generatedQuery, setGeneratedQuery] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'query'>('results')
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table')

  const selectedEntity = entities.find((e) => e.queryName === selectedEntityName) ?? null
  const scalarFields = (selectedEntity?.fields.filter((f) => f.kind === 'scalar') ?? []) as Extract<EntityField, { kind: 'scalar' }>[]

  useEffect(() => {
    if (entities.length > 0 && !selectedEntityName) {
      const first = entities[0]
      setSelectedEntityName(first.queryName)
      setSelectedFields(defaultSelectedFields(first.fields))
    }
  }, [entities, selectedEntityName])

  useEffect(() => {
    if (selectedEntity && selectedFields.size > 0) {
      setGeneratedQuery(buildGraphQLQuery(selectedEntity.queryName, Array.from(selectedFields), combinator, conditions))
    }
  }, [selectedEntity, selectedFields, combinator, conditions])

  const handleEntityChange = (queryName: string) => {
    const entity = entities.find((e) => e.queryName === queryName)
    if (!entity) return
    setSelectedEntityName(queryName)
    setSelectedFields(defaultSelectedFields(entity.fields))
    setExpandedObjects(new Set())
    setConditions([])
    setQueryResult(null)
    setQueryError(null)
  }

  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (next.has(fieldKey)) {
        if (next.size === 1) return prev
        next.delete(fieldKey)
      } else {
        next.add(fieldKey)
      }
      return next
    })
  }

  const toggleObjectExpand = (fieldName: string) => {
    setExpandedObjects((prev) => {
      const next = new Set(prev)
      if (next.has(fieldName)) next.delete(fieldName)
      else next.add(fieldName)
      return next
    })
  }

  const toggleObjectField = (fieldName: string, subFields: { name: string }[]) => {
    const subKeys = subFields.map((sf) => `${fieldName}.${sf.name}`)
    const allSelected = subKeys.every((k) => selectedFields.has(k))
    setSelectedFields((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const k of subKeys) {
          if (next.size > 1) next.delete(k)
        }
      } else {
        for (const k of subKeys) next.add(k)
      }
      return next
    })
  }

  const addCondition = () => {
    const first = scalarFields[0]
    if (!first) return
    setConditions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), field: first.name, operator: operatorsForKind(first.scalarKind)[0], value: '' },
    ])
  }

  const removeCondition = (id: string) => setConditions((prev) => prev.filter((c) => c.id !== id))

  const updateCondition = useCallback(
    (id: string, updates: Partial<Omit<Condition, 'id'>>) => {
      setConditions((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          const next = { ...c, ...updates }
          if (updates.field) {
            const fieldDef = scalarFields.find((f) => f.name === updates.field)
            if (fieldDef) {
              const ops = operatorsForKind(fieldDef.scalarKind)
              if (!ops.includes(next.operator)) next.operator = ops[0]
            }
          }
          return next
        }),
      )
    },
    [scalarFields],
  )

  const runQuery = async () => {
    if (!selectedEntity || selectedFields.size === 0) return
    setIsRunning(true)
    setQueryError(null)
    setQueryResult(null)

    try {
      const response = await fetchWithRetry(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: generatedQuery }),
      })
      const json = await response.json()

      if (json.errors?.length) {
        const msg = json.errors.map((e: { message: string }) => e.message).join('\n')
        setQueryError(msg)
        errorNotification({ title: 'Report failed', description: msg })
        return
      }

      const queryData = json.data?.[selectedEntity.queryName]
      const rows = (queryData?.edges ?? []).map((edge: { node: Record<string, unknown> }) => edge.node)
      setQueryResult({ totalCount: queryData?.totalCount ?? rows.length, rows })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setQueryError(msg)
      errorNotification({ title: 'Report failed', description: msg })
    } finally {
      setIsRunning(false)
    }
  }

  const resultColumns = Array.from(selectedFields)

  const flattenRow = (row: Record<string, unknown>): Record<string, unknown> => {
    const flat: Record<string, unknown> = {}
    for (const key of resultColumns) {
      const dot = key.indexOf('.')
      if (dot === -1) {
        flat[key] = row[key]
      } else {
        const parent = key.slice(0, dot)
        const child = key.slice(dot + 1)
        const parentObj = row[parent] as Record<string, unknown> | null
        flat[key] = parentObj?.[child] ?? null
      }
    }
    return flat
  }

  const exportCsv = () => {
    if (!queryResult) return
    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str
    }
    const header = resultColumns.join(',')
    const rows = queryResult.rows.map((row) => {
      const flat = flattenRow(row)
      return resultColumns.map((col) => escapeCsv(flat[col])).join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedEntity?.displayName ?? 'report'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyQuery = async () => {
    await navigator.clipboard.writeText(generatedQuery)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-4 h-full min-h-0">
      <aside className="w-72 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-card rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground mb-1">Report on</h2>
          <p className="text-xs text-muted-foreground mb-3">Choose the type of data to include in your report</p>
          {schemaLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : schemaError ? (
            <p className="text-sm text-destructive">Failed to load data types</p>
          ) : (
            <select
              value={selectedEntityName}
              onChange={(e) => handleEntityChange(e.target.value)}
              className="w-full rounded-md border border-border bg-background text-foreground text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {entities.map((e) => (
                <option key={e.queryName} value={e.queryName}>
                  {e.displayName}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedEntity && (
          <>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-foreground">Columns</h2>
                <button
                  onClick={() => {
                    const scalarNames = selectedEntity.fields.filter((f) => f.kind === 'scalar').map((f) => f.name)
                    const allChecked = scalarNames.every((n) => selectedFields.has(n))
                    setSelectedFields((prev) => {
                      const next = new Set(prev)
                      if (allChecked) {
                        for (const n of scalarNames) {
                          if (next.size > 1) next.delete(n)
                        }
                      } else {
                        for (const n of scalarNames) next.add(n)
                      }
                      return next
                    })
                  }}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  {selectedEntity.fields.filter((f) => f.kind === 'scalar').every((f) => selectedFields.has(f.name))
                    ? 'Deselect all'
                    : 'Select all'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Select which fields to include</p>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {selectedEntity.fields
                  .filter((f) => f.kind === 'scalar')
                  .map((f) => (
                    <label key={f.name} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedFields.has(f.name)}
                        onChange={() => toggleField(f.name)}
                        className="rounded border-border accent-primary"
                      />
                      <span className="text-sm text-foreground group-hover:text-foreground/80">{toDisplayName(f.name)}</span>
                    </label>
                  ))}
              </div>
            </div>

            {selectedEntity.fields.some((f) => f.kind === 'object') && (
              <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-foreground">Related data</h2>
                  <button
                    onClick={() => {
                      const objectFields = selectedEntity.fields.filter((f) => f.kind === 'object')
                      const allKeys = objectFields.flatMap((f) => f.subFields.map((sf) => `${f.name}.${sf.name}`))
                      const allChecked = allKeys.every((k) => selectedFields.has(k))
                      setSelectedFields((prev) => {
                        const next = new Set(prev)
                        if (allChecked) {
                          for (const k of allKeys) {
                            if (next.size > 1) next.delete(k)
                          }
                        } else {
                          // expand all objects when selecting all
                          setExpandedObjects(new Set(objectFields.map((f) => f.name)))
                          for (const k of allKeys) next.add(k)
                        }
                        return next
                      })
                    }}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    {selectedEntity.fields
                      .filter((f) => f.kind === 'object')
                      .flatMap((f) => f.subFields.map((sf) => `${f.name}.${sf.name}`))
                      .every((k) => selectedFields.has(k))
                      ? 'Deselect all'
                      : 'Select all'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Include fields from linked records</p>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {selectedEntity.fields
                    .filter((f) => f.kind === 'object')
                    .map((f) => {
                      const subKeys = f.subFields.map((sf) => `${f.name}.${sf.name}`)
                      const allSelected = subKeys.every((k) => selectedFields.has(k))
                      const someSelected = subKeys.some((k) => selectedFields.has(k))
                      const isExpanded = expandedObjects.has(f.name)
                      return (
                        <div key={f.name}>
                          <div className="flex items-center gap-2">
                            <IndeterminateCheckbox
                              checked={allSelected}
                              indeterminate={someSelected && !allSelected}
                              onChange={() => toggleObjectField(f.name, f.subFields)}
                            />
                            <button
                              onClick={() => toggleObjectExpand(f.name)}
                              className="flex items-center gap-1 text-sm text-foreground hover:text-foreground/80 flex-1 text-left"
                            >
                              <span className="text-xs text-muted-foreground w-3">{isExpanded ? '▾' : '▸'}</span>
                              {toDisplayName(f.name)}
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="ml-6 flex flex-col gap-1 mt-1 border-l border-border/40 pl-3">
                              {f.subFields.map((sf) => (
                                <label key={sf.name} className="flex items-center gap-2 cursor-pointer group">
                                  <input
                                    type="checkbox"
                                    checked={selectedFields.has(`${f.name}.${sf.name}`)}
                                    onChange={() => toggleField(`${f.name}.${sf.name}`)}
                                    className="rounded border-border accent-primary"
                                  />
                                  <span className="text-sm text-foreground group-hover:text-foreground/80">{toDisplayName(sf.name)}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </>
        )}

        {selectedEntity && (
          <div className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">Filters</h2>
              {conditions.length > 1 && (
                <div className="flex rounded-md overflow-hidden border border-border text-xs">
                  <button
                    onClick={() => setCombinator('and')}
                    className={`px-2 py-1 ${combinator === 'and' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    All match
                  </button>
                  <button
                    onClick={() => setCombinator('or')}
                    className={`px-2 py-1 ${combinator === 'or' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    Any match
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">Narrow down results (optional)</p>

            <div className="flex flex-col gap-2">
              {conditions.map((cond, idx) => {
                const fieldDef = scalarFields.find((f) => f.name === cond.field)
                const ops: Operator[] = fieldDef ? operatorsForKind(fieldDef.scalarKind) : ['eq']
                return (
                  <div key={cond.id} className="flex flex-col gap-1.5 p-2 rounded-md bg-muted/30 border border-border/50">
                    {idx > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {combinator === 'and' ? 'AND' : 'OR'}
                      </span>
                    )}
                    <div className="flex gap-1 items-center">
                      <select
                        value={cond.field}
                        onChange={(e) => updateCondition(cond.id, { field: e.target.value })}
                        className="flex-1 min-w-0 rounded border border-border bg-background text-foreground text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {scalarFields.map((f) => (
                          <option key={f.name} value={f.name}>
                            {toDisplayName(f.name)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeCondition(cond.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive text-xs px-1"
                        aria-label="Remove filter"
                      >
                        ×
                      </button>
                    </div>
                    <select
                      value={cond.operator}
                      onChange={(e) => updateCondition(cond.id, { operator: e.target.value as Operator })}
                      className="w-full rounded border border-border bg-background text-foreground text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {ops.map((op) => (
                        <option key={op} value={op}>
                          {OPERATOR_LABELS[op]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={cond.value}
                      onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                      placeholder="value"
                      className="w-full rounded border border-border bg-background text-foreground text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    />
                  </div>
                )
              })}
            </div>

            <button
              onClick={addCondition}
              className="mt-2 w-full text-xs text-primary hover:text-primary/80 border border-dashed border-border rounded-md py-1.5 hover:bg-muted/30 transition-colors"
            >
              + Add filter
            </button>
          </div>
        )}

        <button
          onClick={runQuery}
          disabled={isRunning || !selectedEntity || selectedFields.size === 0}
          className="w-full rounded-md bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running…' : 'Run Report'}
        </button>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="bg-card rounded-lg border border-border flex-1 min-h-0 flex flex-col">
          <div className="flex items-center border-b border-border px-4">
            <button
              onClick={() => setActiveTab('results')}
              className={`text-sm font-medium py-3 px-2 border-b-2 transition-colors mr-4 ${activeTab === 'results' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              Results
            </button>
            <button
              onClick={() => setActiveTab('query')}
              className={`text-sm font-medium py-3 px-2 border-b-2 transition-colors text-muted-foreground ${activeTab === 'query' ? 'border-primary text-foreground' : 'border-transparent hover:text-foreground'}`}
            >
              Query
            </button>

            {activeTab === 'results' && queryResult && (
              <div className="ml-auto flex items-center gap-2">
                <div className="flex rounded-md overflow-hidden border border-border text-xs">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`px-3 py-1.5 ${viewMode === 'json' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                  >
                    JSON
                  </button>
                </div>
                <button
                  onClick={exportCsv}
                  className="text-xs rounded-md border border-border bg-background text-foreground px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  Export CSV
                </button>
              </div>
            )}

            {activeTab === 'query' && (
              <button
                onClick={copyQuery}
                disabled={!generatedQuery}
                className="ml-auto text-xs rounded-md border border-border bg-background text-foreground px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-auto p-4">
            {activeTab === 'query' ? (
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                {generatedQuery || 'No query generated yet'}
              </pre>
            ) : queryError ? (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
                <p className="text-sm font-semibold text-destructive mb-1">Something went wrong</p>
                <pre className="text-xs text-destructive/80 whitespace-pre-wrap">{queryError}</pre>
              </div>
            ) : queryResult ? (
              viewMode === 'json' ? (
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap">{JSON.stringify(queryResult.rows, null, 2)}</pre>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">{queryResult.totalCount} total records</p>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        {resultColumns.map((col) => (
                          <th key={col} className="text-left text-xs font-medium text-muted-foreground py-2 px-3 whitespace-nowrap">
                            {toDisplayName(col.includes('.') ? col.split('.').map(toDisplayName).join(' › ') : col)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.length === 0 ? (
                        <tr>
                          <td colSpan={resultColumns.length} className="text-center text-muted-foreground text-sm py-8">
                            No records found
                          </td>
                        </tr>
                      ) : (
                        queryResult.rows.map((row, i) => {
                          const flat = flattenRow(row)
                          return (
                            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              {resultColumns.map((col) => (
                                <td key={col} className="text-xs text-foreground py-2 px-3 max-w-xs truncate">
                                  {flat[col] === null || flat[col] === undefined ? (
                                    <span className="text-muted-foreground italic">—</span>
                                  ) : (
                                    String(flat[col])
                                  )}
                                </td>
                              ))}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                <p className="text-foreground font-medium">Ready to build your report</p>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Choose what data to report on, select the columns you want to see, optionally add filters, then click Run Report.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
