'use client'

export const buildAssociationFilter = (controlId?: string, subcontrolIds: string[] = []) => {
  if (controlId && subcontrolIds.length > 0) {
    return {
      or: [{ hasControlsWith: [{ id: controlId }] }, { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }],
    }
  }

  if (controlId) {
    return { hasControlsWith: [{ id: controlId }] }
  }

  if (subcontrolIds.length > 0) {
    return { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }
  }

  return {}
}
