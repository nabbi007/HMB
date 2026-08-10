import { useState } from "react"
import { TextInput } from "flowbite-react"
import { EyeIcon, EyeSlashIcon } from "@/lib/icons"

const inputTheme =
  "[&_input]:rounded-panel [&_input]:border-neutral-border [&_input]:bg-neutral-surface [&_input]:pr-11 [&_input]:text-text-charcoal [&_input]:focus:border-brand-red [&_input]:focus:ring-brand-red"

/** Password input with a show/hide (eye) toggle. */
export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  onFocus,
  onBlur,
}: {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  autoComplete?: string
  onFocus?: () => void
  onBlur?: () => void
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative mt-1.5">
      <TextInput
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={inputTheme}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-charcoal"
      >
        {visible ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </div>
  )
}
