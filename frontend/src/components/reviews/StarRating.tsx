import { StarIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClass = { sm: "size-4", md: "size-5", lg: "size-7" } as const

export function StarRating({ value, onChange, size = "md", className }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]

  if (!onChange) {
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        {stars.map((star) => (
          <StarIcon
            key={star}
            className={cn(sizeClass[size], star <= value ? "text-verify-gold" : "text-neutral-border")}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", className)} role="radiogroup" aria-label="Rating">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <StarIcon
            className={cn(sizeClass[size], star <= value ? "text-verify-gold" : "text-neutral-border")}
          />
        </button>
      ))}
    </div>
  )
}
