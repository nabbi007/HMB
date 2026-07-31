import { Button } from "flowbite-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CheckCircleIcon } from "@/lib/icons"
import { getCaregiver } from "@/lib/mock-data"

export default function BookingConfirmation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caregiver = id ? getCaregiver(id) : undefined

  if (!caregiver) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-lg font-semibold text-text-charcoal">Booking not found</p>
        <Link to="/" className="text-sm font-medium text-brand-red hover:underline">
          Back to search
        </Link>
      </div>
    )
  }

  const firstName = caregiver.name.split(" ")[0]

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center md:px-10">
        <span className="flex size-16 items-center justify-center rounded-full bg-verify-green-bg">
          <CheckCircleIcon className="size-9 text-verify-green" />
        </span>

        <h1 className="mt-5 text-xl font-bold text-text-charcoal md:text-2xl">Booking request sent</h1>
        <p className="mt-2 text-sm text-text-muted">
          {firstName} usually responds within a few hours. You'll get a notification the moment they
          confirm.
        </p>

        <div className="mt-6 flex w-full items-center gap-4 rounded-card bg-background-white p-6 text-left">
          <img
            src={caregiver.avatarUrl}
            alt={caregiver.name}
            className="size-14 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-charcoal">{caregiver.name}</p>
            <p className="text-sm text-text-muted">
              {caregiver.role} · {caregiver.specialty}
            </p>
          </div>
        </div>

        <p className="mt-4 rounded-panel bg-neutral-surface p-3 text-xs text-text-muted">
          Your payment is held in escrow and stays that way until the shift is confirmed complete —{" "}
          {firstName} won't be paid out before then.
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button
            color="default"
            fullSized
            onClick={() => navigate(`/bookings/${caregiver.id}/shift`)}
          >
            View booking status
          </Button>
          <Link
            to="/"
            className="text-sm font-medium text-text-muted hover:text-text-charcoal hover:underline"
          >
            Back to search
          </Link>
        </div>
      </div>
    </div>
  )
}
