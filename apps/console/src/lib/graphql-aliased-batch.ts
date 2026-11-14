import { Kind, parse, visit, type DocumentNode, type FieldNode, type OperationDefinitionNode } from 'graphql'

export type TAliasedBatchRequest = {
  document: DocumentNode
  variables: Record<string, string>
  aliases: string[]
}

export const createAliasedBatchBuilder = (template: string, operationName: string) => {
  const [operation, ...otherDefinitions] = parse(template).definitions
  const selections = operation?.kind === Kind.OPERATION_DEFINITION ? operation.selectionSet.selections : []
  const variableDefinitions = operation?.kind === Kind.OPERATION_DEFINITION ? (operation.variableDefinitions ?? []) : []
  const [rootField] = selections
  const [variable] = variableDefinitions
  if (operation?.kind !== Kind.OPERATION_DEFINITION || otherDefinitions.length > 0 || selections.length !== 1 || rootField?.kind !== Kind.FIELD || variableDefinitions.length !== 1 || !variable) {
    throw new Error('An aliased batch template must be one operation with one root field and one variable')
  }
  const templateOperation: OperationDefinitionNode = operation
  const variableName = variable.variable.name.value

  return (values: readonly string[]): TAliasedBatchRequest => {
    const variableNames = values.map((_, index) => `${variableName}${index}`)
    const aliases = values.map((_, index) => `${rootField.name.value}${index}`)

    const selections: FieldNode[] = variableNames.map((name, index) => ({
      ...visit(rootField, {
        Variable: (node) => (node.name.value === variableName ? { ...node, name: { kind: Kind.NAME, value: name } } : undefined),
      }),
      alias: { kind: Kind.NAME, value: aliases[index] },
    }))

    return {
      document: {
        kind: Kind.DOCUMENT,
        definitions: [
          {
            ...templateOperation,
            name: { kind: Kind.NAME, value: operationName },
            variableDefinitions: variableNames.map((name) => ({ ...variable, variable: { ...variable.variable, name: { kind: Kind.NAME, value: name } } })),
            selectionSet: { ...templateOperation.selectionSet, selections },
          },
        ],
      },
      variables: Object.fromEntries(values.map((value, index) => [variableNames[index], value])),
      aliases,
    }
  }
}
