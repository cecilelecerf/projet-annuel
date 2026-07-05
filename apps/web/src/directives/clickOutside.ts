import type { Directive, DirectiveBinding } from 'vue'

type ClickOutsideElement = HTMLElement & { __clickOutsideHandler__?: (e: MouseEvent) => void }

export const clickOutside: Directive<ClickOutsideElement, (e: MouseEvent) => void> = {
  mounted(el, binding: DirectiveBinding<(e: MouseEvent) => void>) {
    const handler = (e: MouseEvent) => {
      if (el === e.target || el.contains(e.target as Node)) return
      binding.value(e)
    }
    el.__clickOutsideHandler__ = handler
    document.addEventListener('mousedown', handler)
  },
  unmounted(el) {
    if (el.__clickOutsideHandler__) {
      document.removeEventListener('mousedown', el.__clickOutsideHandler__)
      delete el.__clickOutsideHandler__
    }
  },
}
