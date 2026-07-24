import type { AvatarTheme } from "flowbite-react"
import type { DeepPartial } from "flowbite-react/types"
import { withDark } from "./utils"

/**
 * Recolors a Flowbite Avatar's initials background/text — its ring color is applied
 * separately via a plain `ring-*` className on the component instance. Flowbite's
 * size presets (xs/sm/md/lg/xl) don't land on the exact pixel sizes our design
 * calls for, and — same as color — the actual circle size lives on an inner div
 * that a plain `className` override can't reach, so `sizeClassName` overrides the
 * "md" preset directly; pass `size="md"` on the Avatar to pick it up.
 */
export function initialsAvatarTheme(
  bgClassName: string,
  textClassName = "text-white",
  sizeClassName?: string
): DeepPartial<AvatarTheme> {
  return {
    root: {
      initials: {
        base: withDark(`relative inline-flex items-center justify-center overflow-hidden ${bgClassName}`),
        text: withDark(`font-semibold ${textClassName}`),
      },
      ...(sizeClassName ? { size: { md: sizeClassName } } : {}),
    },
  }
}

/**
 * Same "md" size-preset override as `initialsAvatarTheme`, for Avatars rendering
 * a real photo (`img` prop) rather than initials — the recolor half doesn't apply
 * since there's no initials background/text to theme, only the shared size fix.
 */
export function avatarSizeTheme(sizeClassName: string): DeepPartial<AvatarTheme> {
  return { root: { size: { md: sizeClassName } } }
}
