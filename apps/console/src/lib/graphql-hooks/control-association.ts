// filters implementations, objectives and the like to one control or subcontrol
export const controlAssociationFilter = (controlId?: string | null, subcontrolId?: string | null) =>
  subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id: controlId as string }] }
