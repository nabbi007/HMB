import { useNavigate } from "react-router-dom"
import { AuthLayout } from "@/components/auth/AuthLayout"
import { ArrowRightIcon, CaregiverIcon, HeartIcon } from "@/lib/icons"
import { useRole, type Role } from "@/lib/role-context"
import { cn } from "@/lib/utils"

const roles = [
  {
    role: "parent" as Role,
    title: "I need care",
    description: "Find verified nurses, night nurses, babysitters, and caregivers near you.",
    to: "/",
    icon: HeartIcon,
    iconClassName: "bg-brand-red-tint text-brand-red",
  },
  {
    role: "caregiver" as Role,
    title: "I provide care",
    description: "Offer your caregiving services, manage availability, and track earnings.",
    to: "/dashboard",
    icon: CaregiverIcon,
    iconClassName: "bg-verify-green-bg text-verify-green",
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { setRole } = useRole()

  function chooseRole(role: Role, to: string) {
    setRole(role)
    navigate(to)
  }

  return (
    <AuthLayout title="How will you use HelloMama?" subtitle="Choose the option that fits you best.">
      <div className="flex flex-col gap-4">
        {roles.map((option) => (
          <button
            key={option.title}
            type="button"
            onClick={() => chooseRole(option.role, option.to)}
            className="group flex flex-col gap-3 rounded-panel border border-neutral-border p-5 text-left transition-colors hover:border-brand-red hover:bg-neutral-surface"
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full",
                  option.iconClassName
                )}
              >
                <option.icon className="size-5" />
              </span>
              <span className="flex-1 font-semibold text-text-charcoal">{option.title}</span>
              <ArrowRightIcon className="size-5 shrink-0 text-text-muted transition-colors group-hover:text-brand-red" />
            </span>
            <span className="text-sm text-text-muted">{option.description}</span>
          </button>
        ))}
      </div>
    </AuthLayout>
  )
}
