import { checkPassword } from "@/lib/password"
import { cn } from "@/lib/utils"

export function PasswordChecklist({ password }: { password: string }) {
  const c = checkPassword(password)
  const item = (ok: boolean, label: string) => (
    <li className={cn("flex items-center gap-1.5", ok ? "text-verify-green" : "text-text-muted")}>
      <span>{ok ? "✓" : "○"}</span>
      {label}
    </li>
  )
  return (
    <ul className="mt-1.5 flex flex-col gap-0.5 text-xs">
      {item(c.length, "At least 6 characters")}
      {item(c.number, "At least one number")}
      {item(c.special, "At least one special character")}
    </ul>
  )
}
