import { useMemo, useState } from "react"
import { ArrowRightIcon, BackIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

type SlotKey = "morning" | "afternoon" | "evening" | "overnight"

const SLOTS: { key: SlotKey; label: string; hint: string }[] = [
  { key: "morning", label: "Morning", hint: "6am–12pm" },
  { key: "afternoon", label: "Afternoon", hint: "12–5pm" },
  { key: "evening", label: "Evening", hint: "5–9pm" },
  { key: "overnight", label: "Overnight", hint: "9pm–6am" },
]

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function seedAvailability(): Record<string, SlotKey[]> {
  const today = new Date()
  const all: SlotKey[] = ["morning", "afternoon", "evening", "overnight"]
  return {
    [dateKey(today)]: all,
    [dateKey(addDays(today, 1))]: ["morning", "afternoon"],
    [dateKey(addDays(today, 2))]: [],
    [dateKey(addDays(today, 3))]: all,
    [dateKey(addDays(today, 5))]: ["evening", "overnight"],
    [dateKey(addDays(today, 7))]: all,
  }
}

export function AvailabilityCalendar() {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selected, setSelected] = useState(() => dateKey(new Date()))
  const [availability, setAvailability] = useState<Record<string, SlotKey[]>>(seedAvailability)

  const todayKey = dateKey(new Date())

  const cells = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const leadingBlanks = firstOfMonth.getDay()

    const result: (Date | null)[] = []
    for (let i = 0; i < leadingBlanks; i++) result.push(null)
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, month, d))
    return result
  }, [viewDate])

  function changeMonth(delta: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  function toggleSlot(slot: SlotKey) {
    setAvailability((prev) => {
      const current = prev[selected] ?? []
      const next = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot]
      return { ...prev, [selected]: next }
    })
  }

  const selectedSlots = availability[selected] ?? []
  const selectedDateLabel = new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-text-charcoal">
          {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => changeMonth(-1)}
            className="flex size-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-neutral-surface hover:text-text-charcoal"
          >
            <BackIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => changeMonth(1)}
            className="flex size-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-neutral-surface hover:text-text-charcoal"
          >
            <ArrowRightIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-muted">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />
          const key = dateKey(date)
          const slots = availability[key] ?? []
          const isSelected = key === selected
          const isToday = key === todayKey
          const isPast = date < new Date(new Date().toDateString())

          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => setSelected(key)}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30",
                isSelected && "ring-2 ring-brand-red ring-offset-1 ring-offset-background-white",
                slots.length === SLOTS.length
                  ? "bg-verify-green-bg text-verify-green"
                  : slots.length > 0
                    ? "bg-verify-gold-bg text-verify-gold"
                    : "bg-neutral-surface text-text-muted"
              )}
            >
              <span className={cn(isToday && "underline underline-offset-2")}>{date.getDate()}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
        <Legend swatchClassName="bg-verify-green-bg" label="Fully open" />
        <Legend swatchClassName="bg-verify-gold-bg" label="Partly open" />
        <Legend swatchClassName="bg-neutral-surface" label="Unavailable" />
      </div>

      <div className="mt-5 rounded-panel bg-neutral-surface p-4">
        <p className="text-sm font-semibold text-text-charcoal">{selectedDateLabel}</p>
        <p className="mt-0.5 text-xs text-text-muted">Choose which parts of the day you're open for bookings.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SLOTS.map((slot) => {
            const active = selectedSlots.includes(slot.key)
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => toggleSlot(slot.key)}
                className={cn(
                  "rounded-panel border p-2.5 text-center transition-colors",
                  active
                    ? "border-verify-green bg-verify-green-bg text-verify-green"
                    : "border-neutral-border bg-background-white text-text-muted hover:bg-neutral-border/30"
                )}
              >
                <span className="block text-sm font-medium">{slot.label}</span>
                <span className="block text-[11px]">{slot.hint}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Legend({ swatchClassName, label }: { swatchClassName: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", swatchClassName)} />
      {label}
    </span>
  )
}
