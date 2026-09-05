const fs = require('fs')
const path = require('path')
const { parse } = require('graphql')

const MODULES_DIRECTIVE = 'modules'

const schemaPath = path.join(__dirname, '..', 'src', 'schema.graphql')
const typeNamesPath = path.join(__dirname, '..', 'src', 'type-names.ts')
const planEnumPath = path.join(__dirname, '..', 'src', 'plan-enum.ts')
const outputPath = path.join(__dirname, '..', 'src', 'object-modules.ts')

// readPlanEnum returns the PlanEnum member names keyed by the module value they hold, so the
// module values on the directive can be emitted as enum members rather than raw strings
function readPlanEnum() {
  const content = fs.readFileSync(planEnumPath, 'utf8')
  const block = content.match(/export enum PlanEnum \{([\s\S]*?)\n\}/)

  if (!block) {
    throw new Error('could not find the PlanEnum enum in plan-enum.ts')
  }

  const planEnum = new Map()

  for (const [, key, value] of block[1].matchAll(/^\s*(\w+) = '([^']+)',/gm)) {
    planEnum.set(value, key)
  }

  return planEnum
}

// readObjectTypes returns the ObjectTypes values keyed by their lowercased name
// the graphql type names keep their original casing, e.g. APIToken, while ObjectTypes holds
// the pascal cased name codegen produces, e.g. ApiToken, so the two are matched case insensitively
function readObjectTypes() {
  const content = fs.readFileSync(typeNamesPath, 'utf8')
  const block = content.match(/export enum ObjectTypes \{([\s\S]*?)\n\}/)

  if (!block) {
    throw new Error('could not find the ObjectTypes enum in type-names.ts')
  }

  const objectTypes = new Map()

  for (const [, key, value] of block[1].matchAll(/^\s*(\w+) = '([^']+)',/gm)) {
    objectTypes.set(value.toLowerCase(), key)
  }

  return objectTypes
}

// readModulesByType pulls the modules off the @modules directive on each object type
function readModulesByType() {
  const document = parse(fs.readFileSync(schemaPath, 'utf8'))
  const modulesByType = new Map()

  for (const definition of document.definitions) {
    if (definition.kind !== 'ObjectTypeDefinition') continue

    const directive = definition.directives?.find((d) => d.name.value === MODULES_DIRECTIVE)
    if (!directive) continue

    const names = directive.arguments?.find((a) => a.name.value === 'names')
    if (!names || names.value.kind !== 'ListValue') continue

    modulesByType.set(
      definition.name.value,
      names.value.values.map((v) => v.value),
    )
  }

  return modulesByType
}

function generate() {
  const objectTypes = readObjectTypes()
  const planEnum = readPlanEnum()
  const modulesByType = readModulesByType()

  if (modulesByType.size === 0) {
    throw new Error(`no applied @modules directives in ${schemaPath}, schema-ast must run with includeDirectives: true`)
  }

  const entries = []

  for (const [typeName, modules] of modulesByType) {
    const objectType = objectTypes.get(typeName.toLowerCase())

    // types that carry the directive but are not in ObjectTypes are not surfaced in the ui
    if (!objectType) continue

    const members = modules.map((module) => {
      const member = planEnum.get(module)

      // a module in the schema with no PlanEnum member means the catalog gained one the ui
      // does not know about yet, which should fail rather than emit something unusable
      if (!member) {
        throw new Error(`module '${module}' on type ${typeName} has no matching PlanEnum member`)
      }

      return member
    })

    entries.push({ objectType, members })
  }

  entries.sort((a, b) => a.objectType.localeCompare(b.objectType))

  const lines = [
    '/* eslint-disable */',
    '// Generated from the @modules directives in the core graphql schema, DO NOT EDIT',
    '',
    "import { ObjectTypes } from './type-names'",
    "import { PlanEnum } from './plan-enum'",
    '',
    '// the modules an organization needs for each object type, at least one is required',
    '// object types missing here are not gated',
    'export const GENERATED_MODULES_BY_OBJECT_TYPE: Partial<Record<ObjectTypes, PlanEnum[]>> = {',
    ...entries.map(({ objectType, members }) => `  [ObjectTypes.${objectType}]: [${members.map((m) => `PlanEnum.${m}`).join(', ')}],`),
    '}',
    '',
  ]

  fs.writeFileSync(outputPath, lines.join('\n'))

  console.log(`generated ${entries.length} object module entries to ${outputPath}`)
}

generate()
