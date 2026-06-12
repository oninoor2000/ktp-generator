import * as React from 'react'

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

type ClickEvent = Pick<MouseEvent, 'clientX' | 'clientY'>

function setOriginFromEvent(event: ClickEvent) {
  const x = (event.clientX / window.innerWidth) * 100
  const y = (event.clientY / window.innerHeight) * 100
  document.documentElement.style.setProperty('--x', `${x}%`)
  document.documentElement.style.setProperty('--y', `${y}%`)
}

// Wraps a theme-change callback in `document.startViewTransition` so the
// browser animates the difference between the old and new theme trees via
// the ::view-transition-* pseudo-elements in app.css. The reveal origin
// is taken from the actual click point (event.clientX/clientY), so the
// new theme appears to expand out of where the user clicked.
//
// Re-entrancy is guarded with a module-scoped flag so rapid double-clicks
// don't stack two transitions on top of each other.
let busy = false

export function withThemeTransition(event: ClickEvent, change: () => void) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    change()
    return
  }

  if (busy) {
    // A transition is already in flight. Apply the new state immediately
    // (the user wants the new theme) but don't start a second animation.
    change()
    return
  }

  setOriginFromEvent(event)

  const doc = document as DocumentWithViewTransition
  if (typeof doc.startViewTransition !== 'function') {
    change()
    return
  }

  busy = true
  const transition = doc.startViewTransition(() => {
    change()
  })

  // `finished` resolves when the new snapshot commits and the
  // pseudo-element animation ends. We release the busy flag in both the
  // success and error paths (`skipTransition()` rejects).
  transition.finished
    .catch(() => {
      // ignore — the theme change still applied
    })
    .finally(() => {
      busy = false
    })
}

// React hook variant for menu items: returns a stable callback that takes
// the React.MouseEvent and forwards clientX/clientY into the wrapper.
export function useThemeTransition() {
  return React.useCallback((event: React.MouseEvent, change: () => void) => {
    withThemeTransition(event, change)
  }, [])
}
