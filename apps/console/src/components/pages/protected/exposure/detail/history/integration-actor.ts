import { isIntegrationDefinitionID, type ResolvedAuthor } from '@/lib/authors'
import { type TIntegrationInstaller } from '@/lib/graphql-hooks/integration'
import { type IntegrationProvider } from '@/lib/integrations/types'
import { installedIntegrationDisplayName, providerForDefinitionID } from '@/lib/integrations/utils'

export type TIntegrationProvenance = {
  managedBy?: string | null
  sourceDefinitionID?: string | null
}

export type TResolveActor = (id: string, provenance?: TIntegrationProvenance) => string | null

type TActorResolverArgs = {
  installations: TIntegrationInstaller[]
  providers: IntegrationProvider[]
  authorOf: (id: string) => ResolvedAuthor
  authorsResolving: boolean
}

const PERSON_AUTHOR_KINDS: ReadonlySet<ResolvedAuthor['kind']> = new Set(['user', 'support', 'token'])

const uniqueSorted = (values: Array<string | null | undefined>) => [...new Set(values.filter((value): value is string => !!value))].sort()

export const integrationLookupIds = (provenances: Array<TIntegrationProvenance | undefined>, actorIds: Array<string | null | undefined>) => ({
  installationIds: uniqueSorted(provenances.map((provenance) => provenance?.managedBy)),
  definitionIDs: uniqueSorted([...provenances.map((provenance) => provenance?.sourceDefinitionID), ...actorIds.filter(isIntegrationDefinitionID)]),
})

const installationFor = (installations: TIntegrationInstaller[], definitionID: string | null | undefined, managedBy: string | null | undefined) => {
  if (managedBy) {
    const managing = installations.find((installation) => installation.id === managedBy)
    return managing && (!definitionID || managing.definitionID === definitionID) ? managing : undefined
  }
  const candidates = definitionID ? installations.filter((installation) => installation.definitionID === definitionID) : []
  return candidates.length === 1 ? candidates[0] : undefined
}

export const createActorResolver =
  ({ installations, providers, authorOf, authorsResolving }: TActorResolverArgs): TResolveActor =>
  (id, provenance) => {
    const author = authorOf(id)
    if (author.kind !== 'integration') {
      return author.kind === 'unknown' || author.kind === 'unresolved' ? null : author.displayName
    }

    const definitionID = isIntegrationDefinitionID(id) ? id : provenance?.sourceDefinitionID
    const installation = provenance ? installationFor(installations, definitionID, provenance.managedBy) : undefined
    const installer = installation?.createdBy ? authorOf(installation.createdBy) : undefined
    if (installer?.kind === 'unresolved' && authorsResolving) return null
    if (installer && PERSON_AUTHOR_KINDS.has(installer.kind)) return installer.displayName
    if (installation) return installedIntegrationDisplayName(installation, providers)
    return providerForDefinitionID(definitionID, providers)?.displayName ?? author.displayName
  }
