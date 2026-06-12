"use client"

import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

import { useNextTheme } from '~/components/theme-provider'
import { useThemeTransition } from '~/lib/use-theme-transition'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

// Render placeholder during SSR / first paint to avoid hydration mismatch
// (server can't know the user's theme; client only knows after the inline
// <head> script runs). `mounted` flips after `useEffect` fires.
export function ModeToggle({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { theme, setTheme, resolvedTheme } = useNextTheme()
  const withTransition = useThemeTransition()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'
  const Icon = !mounted ? Monitor : isDark ? Sun : Moon
  const label = !mounted
    ? 'Toggle theme'
    : isDark
      ? 'Switch to light theme'
      : 'Switch to dark theme'

  // The mouse event is forwarded into the wrapper so the reveal origin
  // matches the click point (the menu item, not the trigger button).
  const onSelect = React.useCallback(
    (event: React.MouseEvent, next: 'light' | 'dark' | 'system') => {
      if (!mounted) return
      withTransition(event, () => setTheme(next))
    },
    [mounted, withTransition, setTheme],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            data-theme-toggle=""
            className={`mode-toggle-button ${className ?? ''}`}
            {...props}
          >
            <Icon aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-36">
        <DropdownMenuItem
          aria-checked={mounted ? theme === 'light' : undefined}
          onClick={(event) => onSelect(event, 'light')}
        >
          <Sun aria-hidden="true" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-checked={mounted ? theme === 'dark' : undefined}
          onClick={(event) => onSelect(event, 'dark')}
        >
          <Moon aria-hidden="true" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          aria-checked={mounted ? theme === 'system' : undefined}
          onClick={(event) => onSelect(event, 'system')}
        >
          <Monitor aria-hidden="true" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
