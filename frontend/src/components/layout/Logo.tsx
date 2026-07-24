import { cn } from "@/lib/utils"

// The logo file is a single solid-fill SVG (baked-in red), so it's applied as a
// mask rather than an <img> — that lets us recolor it per theme (brand red in
// light mode, white in dark mode) instead of being stuck with the file's own fill.
export function Logo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="HelloMama"
      className={cn("inline-block h-8 w-auto bg-brand-red dark:bg-white", className)}
      style={{
        aspectRatio: "374 / 96",
        maskImage: "url(/HMB%20Logo.svg)",
        maskRepeat: "no-repeat",
        maskPosition: "left center",
        maskSize: "contain",
        WebkitMaskImage: "url(/HMB%20Logo.svg)",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        WebkitMaskSize: "contain",
      }}
    />
  )
}
