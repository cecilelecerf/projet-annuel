import { onMounted, onUnmounted, ref } from 'vue'

// Doit rester synchronisé avec $breakpoints dans breakpoints.scss
const BREAKPOINTS = {
  xs: 450,
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const

export function useBelowBreakpoint(bp: keyof typeof BREAKPOINTS) {
  const isBelow = ref(false)
  const isAbove = ref(false)
  let mediaQuery: MediaQueryList | undefined

  const update = () => {
    isBelow.value = mediaQuery?.matches ?? false
    isAbove.value = mediaQuery?.matches ?? false
  }

  onMounted(() => {
    mediaQuery = window.matchMedia(`(max-width: ${BREAKPOINTS[bp]}px)`)
    mediaQuery = window.matchMedia(`(min-width: ${BREAKPOINTS[bp]}px)`)
    update()
    mediaQuery.addEventListener('change', update)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', update)
  })

  return { isBelow, isAbove }
}
