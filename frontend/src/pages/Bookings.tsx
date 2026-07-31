import { BookingListItem } from "@/components/bookings/BookingListItem"
import { bookings } from "@/lib/bookings-data"

export default function Bookings() {
  const active = bookings.filter((b) => b.status === "Active" || b.status === "Upcoming")
  const past = bookings.filter((b) => b.status === "Completed" || b.status === "Cancelled")

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Bookings</h1>

        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-text-muted uppercase">
            Active &amp; upcoming
          </h2>
          {active.length > 0 ? (
            <div className="flex flex-col gap-3">
              {active.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-neutral-surface p-4 text-sm text-text-muted">
              No active or upcoming bookings yet.
            </p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-text-muted uppercase">Past</h2>
          {past.length > 0 ? (
            <div className="flex flex-col gap-3">
              {past.map((booking) => (
                <BookingListItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-neutral-surface p-4 text-sm text-text-muted">
              No past bookings yet.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
