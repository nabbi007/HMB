import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AddIcon, BackIcon, CheckCircleIcon, TrashIcon, UploadIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

type DocStatus = "none" | "pending" | "verified"

interface Certification {
  id: string
  name: string
  fileName: string
}

const statusMeta: Record<DocStatus, { label: string; className: string }> = {
  none: { label: "Not submitted", className: "bg-neutral-surface text-text-muted" },
  pending: { label: "Pending review", className: "bg-verify-gold-bg text-verify-gold" },
  verified: { label: "Verified", className: "bg-verify-green-bg text-verify-green" },
}

export default function VerificationUpload() {
  const [idFile, setIdFile] = useState<string | null>(null)
  const [idStatus, setIdStatus] = useState<DocStatus>("none")
  const [bgStatus, setBgStatus] = useState<DocStatus>("none")
  const [certifications, setCertifications] = useState<Certification[]>([
    { id: "c1", name: "RN License", fileName: "rn-license.pdf" },
    { id: "c2", name: "Newborn CPR", fileName: "cpr-cert.pdf" },
  ])
  const [addingCert, setAddingCert] = useState(false)
  const [newCertName, setNewCertName] = useState("")

  const idInputRef = useRef<HTMLInputElement>(null)
  const certInputRef = useRef<HTMLInputElement>(null)

  const totalSteps = 3
  const completedSteps =
    (idStatus === "verified" ? 1 : 0) +
    (bgStatus === "verified" ? 1 : 0) +
    (certifications.length > 0 ? 1 : 0)
  const progressPct = Math.round((completedSteps / totalSteps) * 100)

  function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIdFile(file.name)
    setIdStatus("pending")
  }

  function addCertification(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !newCertName.trim()) return
    setCertifications((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: newCertName.trim(), fileName: file.name },
    ])
    setNewCertName("")
    setAddingCert(false)
  }

  function removeCertification(id: string) {
    setCertifications((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="h-full overflow-y-auto bg-background-offwhite">
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-10 md:py-10">
        <Link
          to="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-charcoal"
        >
          <BackIcon className="size-4" />
          Back to dashboard
        </Link>

        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">Verification &amp; documents</h1>
        <p className="mt-1 text-sm text-text-muted">
          Complete these steps to earn your verified badge and start receiving bookings.
        </p>

        {/* Progress */}
        <div className="mt-6 rounded-card bg-background-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-charcoal">Verification progress</p>
            <p className="text-sm text-text-muted">
              {completedSteps} of {totalSteps} complete
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-surface">
            <div
              className="h-full rounded-full bg-brand-red transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Government ID */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-charcoal">Government ID</h2>
              <p className="mt-1 text-sm text-text-muted">
                A valid passport, driver's license, or national ID card.
              </p>
            </div>
            <StatusBadge status={idStatus} />
          </div>

          <input
            ref={idInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleIdUpload}
          />
          <button
            type="button"
            onClick={() => idInputRef.current?.click()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-panel border border-dashed border-neutral-border bg-neutral-surface px-4 py-3 text-sm font-medium text-text-charcoal transition-colors hover:bg-neutral-border/30"
          >
            <UploadIcon className="size-4.5" />
            {idFile ?? "Upload ID document"}
          </button>
        </section>

        {/* Background check */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-text-charcoal">Background check</h2>
              <p className="mt-1 text-sm text-text-muted">
                We run a criminal record and identity check through our verification partner.
              </p>
            </div>
            <StatusBadge status={bgStatus} />
          </div>

          {bgStatus === "none" ? (
            <button
              type="button"
              onClick={() => setBgStatus("pending")}
              className="mt-4 w-full rounded-panel bg-brand-red px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Authorize background check
            </button>
          ) : (
            <p className="mt-4 text-sm text-text-muted">
              {bgStatus === "pending"
                ? "Your background check is in progress — this usually takes 1–3 business days."
                : "Your background check is complete."}
            </p>
          )}
        </section>

        {/* Certifications */}
        <section className="mt-6 rounded-card bg-background-white p-6">
          <h2 className="text-lg font-semibold text-text-charcoal">Certifications &amp; licenses</h2>
          <p className="mt-1 text-sm text-text-muted">
            Nursing licenses, CPR, first aid, or any specialty certifications.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between gap-3 rounded-panel bg-neutral-surface p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <CheckCircleIcon className="size-4.5 shrink-0 text-verify-green" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-charcoal">{cert.name}</p>
                    <p className="truncate text-xs text-text-muted">{cert.fileName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCertification(cert.id)}
                  aria-label={`Remove ${cert.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-border/40 hover:text-brand-red"
                >
                  <TrashIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>

          {addingCert ? (
            <div className="mt-3 flex flex-col gap-2 rounded-panel border border-neutral-border p-3">
              <input
                autoFocus
                value={newCertName}
                onChange={(e) => setNewCertName(e.target.value)}
                placeholder="Certification name (e.g. First Aid)"
                className="rounded-panel border border-neutral-border bg-neutral-surface px-3 py-2 text-sm text-text-charcoal placeholder:text-text-muted focus:border-brand-red focus:ring-brand-red focus:outline-none"
              />
              <input
                ref={certInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={addCertification}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!newCertName.trim()}
                  onClick={() => certInputRef.current?.click()}
                  className="flex-1 rounded-panel bg-brand-red px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Choose file
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingCert(false)
                    setNewCertName("")
                  }}
                  className="rounded-panel border border-neutral-border bg-background-white px-3 py-2 text-sm font-medium text-text-charcoal transition-colors hover:bg-neutral-surface"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCert(true)}
              className={cn(
                "mt-3 flex w-full items-center justify-center gap-1.5 rounded-panel border border-dashed border-neutral-border p-3 text-sm font-medium text-text-muted transition-colors hover:bg-neutral-surface hover:text-text-charcoal"
              )}
            >
              <AddIcon className="size-4" />
              Add certification
            </button>
          )}
        </section>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: DocStatus }) {
  const meta = statusMeta[status]
  return (
    <span className={cn("shrink-0 rounded-[10px] px-2.5 py-1 text-xs font-medium", meta.className)}>
      {meta.label}
    </span>
  )
}
