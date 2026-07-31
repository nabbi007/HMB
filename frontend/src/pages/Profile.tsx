import { useState } from "react"
import { Button, ToggleSwitch, useThemeMode } from "flowbite-react"
import { useNavigate } from "react-router-dom"
import { LogoutIcon } from "@/lib/icons"
import { withDark } from "@/lib/utils"

export const currentUser = {
  name: "Adwoa Darko",
  email: "adwoa.darko@gmail.com",
  phone: "+233 20 555 0142",
  location: "Osu, Accra",
  avatarUrl: "https://i.pravatar.cc/150?img=32",
}

// Button's "light" color ships its own `dark:bg-gray-800` classes. Its `theme` prop
// merges with those via twMerge rather than replacing them, so the override needs
// its own `dark:` twins (via withDark) to actually cancel them out.
const lightButtonTheme = {
  color: {
    light: withDark("border-neutral-border bg-background-white text-text-charcoal hover:bg-neutral-surface"),
  },
}

export default function Profile() {
  const navigate = useNavigate()
  const { computedMode, toggleMode } = useThemeMode()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-10 md:py-10">
        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Profile</h1>

        {/* Header */}
        <div className="mt-6 flex flex-col items-center gap-4 rounded-card bg-background-white p-6 text-center md:flex-row md:text-left">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="size-20 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-text-charcoal">{currentUser.name}</p>
            <p className="text-sm text-text-muted">{currentUser.email}</p>
            <p className="text-sm text-text-muted">{currentUser.location}</p>
          </div>
          <Button color="light" theme={lightButtonTheme}>
            Edit profile
          </Button>
        </div>

        {/* Account details */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Account details</h2>
          <dl className="mt-4 flex flex-col divide-y divide-neutral-border">
            <Row label="Name" value={currentUser.name} />
            <Row label="Email" value={currentUser.email} />
            <Row label="Phone" value={currentUser.phone} />
            <Row label="Location" value={currentUser.location} />
          </dl>
        </section>

        {/* Preferences */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Preferences</h2>
          <div className="mt-4 flex flex-col divide-y divide-neutral-border">
            <ToggleRow
              label="Push notifications"
              description="Booking updates and caregiver messages"
              checked={pushEnabled}
              onChange={setPushEnabled}
            />
            <ToggleRow
              label="Email updates"
              description="Receipts and account activity"
              checked={emailEnabled}
              onChange={setEmailEnabled}
            />
            <ToggleRow
              label="Dark mode"
              description="Match your device or switch manually"
              checked={computedMode === "dark"}
              onChange={toggleMode}
            />
          </div>
        </section>

        {/* Payment */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Payment methods</h2>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-panel bg-neutral-surface p-4">
            <div>
              <p className="text-sm font-medium text-text-charcoal">Visa •••• 4242</p>
              <p className="text-xs text-text-muted">Used for escrow-held booking payments</p>
            </div>
            <button type="button" className="text-sm font-medium text-brand-red hover:underline">
              Manage
            </button>
          </div>
        </section>

        {/* Sign out */}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-panel border border-neutral-border bg-background-white px-5 py-3 text-sm font-semibold text-text-charcoal transition-colors hover:bg-neutral-surface"
        >
          <LogoutIcon className="size-4.5" />
          Log out
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-text-charcoal">{value}</dd>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-charcoal">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}
