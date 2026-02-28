import { OBJECT_QUERY_CONFIG } from '../object-association-config'

export type TObjectAssociationInputName = (typeof OBJECT_QUERY_CONFIG)[keyof typeof OBJECT_QUERY_CONFIG]['inputName']

type TAssociationMutationPrefix = 'add' | 'remove'

export type TAssociationMutationKey<TPrefix extends TAssociationMutationPrefix, TFieldKey extends string> = `${TPrefix}${Capitalize<TFieldKey>}`

export type TAssociationUpdateInput<TFieldKey extends string> = Partial<Record<TAssociationMutationKey<TAssociationMutationPrefix, TFieldKey>, string[]>>

export type TObjectAssociationMap<TFieldKey extends string = TObjectAssociationInputName> = Partial<Record<TFieldKey, string[]>>
