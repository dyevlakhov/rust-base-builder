const EDITABLE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

/**
 * True when a keyboard event came from somewhere the user is typing, so global
 * shortcuts should stay out of the way.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || EDITABLE_TAGS.includes(target.tagName)
}
