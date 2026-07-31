import { StarRating } from "./StarRating"

interface ReviewCardProps {
  authorName: string
  authorAvatarUrl: string
  rating: number
  date: string
  comment: string
}

export function ReviewCard({ authorName, authorAvatarUrl, rating, date, comment }: ReviewCardProps) {
  return (
    <div className="rounded-2xl bg-neutral-surface p-4">
      <div className="flex items-center gap-3">
        <img src={authorAvatarUrl} alt={authorName} className="size-10 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-charcoal">{authorName}</p>
          <p className="text-xs text-text-muted">{date}</p>
        </div>
        <StarRating value={rating} size="sm" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{comment}</p>
    </div>
  )
}
