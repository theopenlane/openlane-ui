// filters implementations, objectives and the like to one control or subcontrol
type ControlAssociationFilter = { hasSubcontrolsWith: [{ id: string }] } | { hasControlsWith: [{ id: string }] }

export const controlAssociationFilter = (controlId: string, subcontrolId?: string | null): ControlAssociationFilter =>
  subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id: controlId }] }
