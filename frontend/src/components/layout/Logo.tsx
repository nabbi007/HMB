import { cn } from "@/lib/utils"

// Text wordmark for the full brand name. (The old script SVG only spelled
// "HelloMama" as vector art and couldn't be extended to "…Better", so the
// wordmark is rendered as styled text — theme-aware, brand-red in light mode.)
export function Logo({ className }: { className?: string }) {
  const sizeClass = className?.includes("h-9")
    ? "text-3xl"
    : className?.includes("h-8")
      ? "text-2xl"
      : className?.includes("h-7")
        ? "text-xl"
        : className?.includes("h-6")
          ? "text-lg"
          : "text-2xl"

  return (
    <span
      role="img"
      aria-label="HelloMamaBetter"
      className={cn(
        "inline-block leading-none font-extrabold tracking-tight whitespace-nowrap text-brand-red dark:text-white",
        sizeClass
      )}
    >
      HelloMama<span className="text-text-charcoal dark:text-white/85">Better</span>
    </span>
  )
}
