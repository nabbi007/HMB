import { useState } from "react"
import { Button, Textarea } from "flowbite-react"
import { CheckCircleIcon } from "@/lib/icons"
import { StarRating } from "./StarRating"

interface ExistingReview {
  rating: number
  comment: string
  date: string
}

interface ReviewFormProps {
  targetName: string
  targetAvatarUrl: string
  targetMeta: string
  prompt: string
  placeholder: string
  submittedMessage: string
  existingReview?: ExistingReview
}

export function ReviewForm({
  targetName,
  targetAvatarUrl,
  targetMeta,
  prompt,
  placeholder,
  submittedMessage,
  existingReview,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const header = (
    <div className="flex items-center gap-4">
      <img src={targetAvatarUrl} alt={targetName} className="size-14 shrink-0 rounded-full object-cover" />
      <div className="min-w-0">
        <p className="font-semibold text-text-charcoal">{targetName}</p>
        <p className="text-sm text-text-muted">{targetMeta}</p>
      </div>
    </div>
  )

  if (existingReview) {
    return (
      <div className="rounded-card bg-background-white p-6 md:p-8">
        {header}
        <div className="mt-6 rounded-2xl bg-neutral-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <StarRating value={existingReview.rating} size="sm" />
            <span className="text-xs text-text-muted">{existingReview.date}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{existingReview.comment}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card bg-background-white p-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-verify-green-bg">
          <CheckCircleIcon className="size-8 text-verify-green" />
        </span>
        <p className="text-lg font-semibold text-text-charcoal">Review submitted</p>
        <p className="text-sm text-text-muted">{submittedMessage}</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (rating === 0) return
        setSubmitted(true)
      }}
      className="rounded-card bg-background-white p-6 md:p-8"
    >
      {header}

      <div className="mt-6">
        <p className="text-sm font-medium text-text-charcoal">{prompt}</p>
        <StarRating value={rating} onChange={setRating} size="lg" className="mt-2" />
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="mt-5 rounded-panel border-neutral-border bg-neutral-surface text-text-charcoal placeholder:text-text-muted focus:border-brand-red focus:ring-brand-red"
      />

      <Button type="submit" color="default" fullSized className="mt-5" disabled={rating === 0}>
        Submit review
      </Button>
    </form>
  )
}
