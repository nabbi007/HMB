export function PagePlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 overflow-y-auto px-6 py-10 text-center">
      <p className="text-xs font-medium tracking-wide text-brand-red uppercase">
        Coming up next
      </p>
      <h1 className="text-2xl font-bold text-text-charcoal">{title}</h1>
      <p className="max-w-md text-sm text-text-muted">{description}</p>
    </div>
  )
}
