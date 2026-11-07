export const isModifiedClick = (event: Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>) => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
