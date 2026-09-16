import fs from 'node:fs'
import path from 'node:path'
import { Kind, parse } from 'graphql'
import type { FragmentDefinitionNode, OperationDefinitionNode, SelectionSetNode } from 'graphql'

export const COMPLEXITY_LIMIT = 200

export type ScoredOperation = {
  name: string
  operation: OperationDefinitionNode['operation']
  file: string
  complexity: number
}

const extractTaggedTemplates = (source: string): string[] => {
  const templates: string[] = []
  const tag = /gql`/g
  let match = tag.exec(source)

  while (match !== null) {
    let index = tag.lastIndex
    let interpolationDepth = 0
    let body = ''

    while (index < source.length) {
      const char = source[index]

      if (char === '\\') {
        body += source[index] + source[index + 1]
        index += 2
        continue
      }

      if (char === '$' && source[index + 1] === '{') {
        interpolationDepth += 1
        index += 2
        continue
      }

      if (interpolationDepth > 0) {
        if (char === '}') {
          interpolationDepth -= 1
        }
        index += 1
        continue
      }

      if (char === '`') {
        break
      }

      body += char
      index += 1
    }

    templates.push(body)
    match = tag.exec(source)
  }

  return templates
}

const scoreSelectionSet = (selectionSet: SelectionSetNode | undefined, fragments: Map<string, FragmentDefinitionNode>, visited: Set<string>): number => {
  if (!selectionSet) {
    return 0
  }

  let total = 0

  for (const selection of selectionSet.selections) {
    if (selection.kind === Kind.FIELD) {
      total += 1 + scoreSelectionSet(selection.selectionSet, fragments, visited)
      continue
    }

    if (selection.kind === Kind.INLINE_FRAGMENT) {
      total += scoreSelectionSet(selection.selectionSet, fragments, visited)
      continue
    }

    const fragmentName = selection.name.value

    if (visited.has(fragmentName)) {
      continue
    }

    const fragment = fragments.get(fragmentName)

    if (!fragment) {
      continue
    }

    visited.add(fragmentName)
    total += scoreSelectionSet(fragment.selectionSet, fragments, visited)
    visited.delete(fragmentName)
  }

  return total
}

export const scoreOperationsIn = (directory: string): ScoredOperation[] => {
  const fragments = new Map<string, FragmentDefinitionNode>()
  const collected: { node: OperationDefinitionNode; file: string }[] = []

  for (const entry of fs.readdirSync(directory)) {
    if (!entry.endsWith('.ts')) {
      continue
    }

    const source = fs.readFileSync(path.join(directory, entry), 'utf8')

    for (const template of extractTaggedTemplates(source)) {
      const document = parse(template)

      for (const definition of document.definitions) {
        if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          fragments.set(definition.name.value, definition)
        } else if (definition.kind === Kind.OPERATION_DEFINITION) {
          collected.push({ node: definition, file: entry })
        }
      }
    }
  }

  return collected
    .map(({ node, file }) => ({
      name: node.name?.value ?? '(anonymous)',
      operation: node.operation,
      file,
      complexity: scoreSelectionSet(node.selectionSet, fragments, new Set<string>()),
    }))
    .sort((left, right) => right.complexity - left.complexity)
}
