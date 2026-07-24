import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Flowbite React's `theme` prop merges with the component's default theme via
 * `twMerge` rather than replacing it outright — an override with no `dark:`
 * classes leaves the component's own baked-in `dark:*` defaults in place, and
 * those win in dark mode since there's nothing to cancel them. Our own tokens
 * (background-white, text-charcoal, etc.) already swap value via the `.dark`
 * ancestor selector, so mirroring every class as its own `dark:` twin is enough
 * to make an override "stick" in both modes.
 */
export function withDark(classNames: string): string {
  const classes = classNames.trim().split(/\s+/)
  return classes.concat(classes.map((c) => `dark:${c}`)).join(" ")
}
