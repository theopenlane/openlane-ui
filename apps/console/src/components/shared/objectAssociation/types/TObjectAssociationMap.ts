import { OBJECT_QUERY_CONFIG } from '../object-assoiation-config'

export type TObjectAssociationMap = Partial<Record<(typeof OBJECT_QUERY_CONFIG)[keyof typeof OBJECT_QUERY_CONFIG]['inputName'], string[]>>
