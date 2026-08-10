export interface PasswordChecks {
  length: boolean
  number: boolean
  special: boolean
}

// Must mirror the backend rule (app/core/security.py): 6+ chars, a number, a special char.
export function checkPassword(pw: string): PasswordChecks {
  return {
    length: pw.length >= 6,
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

export function passwordValid(pw: string): boolean {
  const c = checkPassword(pw)
  return c.length && c.number && c.special
}
