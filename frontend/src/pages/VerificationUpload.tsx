import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { AddIcon, BackIcon, CheckCircleIcon, TrashIcon, UploadIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { useRole } from "@/lib/role-context"
import { api, ApiError, mediaUrl, uploadFile } from "@/lib/api"

type DocStatus = "none" | "pending" | "verified"

interface Certification {
  name: string
  url: string
}

const statusMeta: Record<DocStatus, { label: string; className: string }> = {
  none: { label: "Not submitted", className: "bg-neutral-surface text-text-muted" },
  pending: { label: "Pending review", className: "bg-verify-gold-bg text-verify-gold" },
  verified: { label: "Verified", className: "bg-verify-green-bg text-verify-green" },
}

export default function VerificationUpload() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoStatus, setPhotoStatus] = useState<DocStatus>("none")
  const [idFile, setIdFile] = useState<string | null>(null)
  const [idStatus, setIdStatus] = useState<DocStatus>("none")
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [savingCert, setSavingCert] = useState(false)

  const photoInputRef = useRef<HTMLInputElement>(null)
  const idInputRef = useRef<HTMLInputElement>(null)
  const certInputRef = useRef<HTMLInputElement>(null)

  const { token } = useRole()
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  // Load any previously submitted photo / ID / certifications.
  useEffect(() => {
    if (!token) return
    api<{
      profile_photo_url: string | null
      passport_photo_url: string | null
      certifications: Certification[] | null
    }>("/api/v1/nurses/me", { token })
      .then((p) => {
        if (p.profile_photo_url) {
          setPhotoUrl(mediaUrl(p.profile_photo_url) ?? null)
          setPhotoStatus("pending")
        }
        if (p.passport_photo_url) {
          setIdFile("Uploaded")
          setIdStatus("pending")
        }
        setCertifications(p.certifications ?? [])
      })
      .catch(() => {})
  }, [token])

  // Only the required documents count toward progress.
  const requiredTotal = 2
  const requiredDone = (photoStatus !== "none" ? 1 : 0) + (idStatus !== "none" ? 1 : 0)
  const progressPct = Math.round((requiredDone / requiredTotal) * 100)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadErr(null)
    try {
      const { url } = await uploadFile(file, token ?? undefined)
      await api("/api/v1/nurses/me", {
        method: "PATCH",
        body: { profile_photo_url: url },
        token: token ?? undefined,
      })
      setPhotoUrl(mediaUrl(url) ?? null)
      setPhotoStatus("pending")
    } catch (err) {
      setUploadErr(err instanceof ApiError ? err.detail : "Upload failed. Try again.")
    }
  }

  async function handleIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadErr(null)
    try {
      const { url } = await uploadFile(file, token ?? undefined)
      await api("/api/v1/nurses/me", {
        method: "PATCH",
        body: { passport_photo_url: url },
        token: token ?? undefined,
      })
      setIdFile(file.name)
      setIdStatus("pending")
    } catch (err) {
      setUploadErr(err instanceof ApiError ? err.detail : "Upload failed. Try again.")
    }
  }

  async function persistCertifications(next: Certification[]) {
    await api("/api/v1/nurses/me", {
      method: "PATCH",
      body: { certifications: next },
      token: token ?? undefined,
    })
    setCertifications(next)
  }

  async function addCertification(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = "" // allow re-picking the same file later
    if (!file) return
    setUploadErr(null)
    setSavingCert(true)
    try {
      const { url } = await uploadFile(file, token ?? undefined)
      // The certification's name is the uploaded file's own name.
      await persistCertifications([...certifications, { name: file.name, url }])
    } catch (err) {
      setUploadErr(err instanceof ApiError ? err.detail : "Upload failed. Try again.")
    } finally {
      setSavingCert(false)
    }
  }

  async function removeCertification(url: string) {
    setUploadErr(null)
    try {
      await persistCertifications(certifications.filter((c) => c.url !== url))
    } catch (err) {
      setUploadErr(err instanceof ApiError ? err.detail : "Couldn't remove. Try again.")
    }
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

        <h1 className="text-xl font-bold text-text-charcoal md:text-2xl">
          Verification &amp; documents
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Submit your required documents to earn your verified badge and start receiving bookings.
          HMB runs the background check for you — no action needed on your part.
        </p>

        {uploadErr ? (
          <p className="mt-4 rounded-panel bg-brand-red-tint px-3 py-2 text-sm text-brand-red">
            {uploadErr}
          </p>
        ) : null}

        {/* Progress (required documents only) */}
        <div className="mt-6 rounded-card bg-background-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-charcoal">Required documents</p>
            <p className="text-sm text-text-muted">
              {requiredDone} of {requiredTotal} submitted
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-surface">
            <div
              className="h-full rounded-full bg-brand-red transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* --- Required --- */}
        <h2 className="mt-8 text-xs font-semibold tracking-wide text-text-muted uppercase">
          Required
        </h2>

        {/* Profile photo */}
        <section className="mt-3 rounded-card bg-background-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-charcoal">Profile photo</h3>
                <ReqTag required />
              </div>
              <p className="mt-1 text-sm text-text-muted">
                A clear photo of your face. Families must see who they're booking.
              </p>
            </div>
            <StatusBadge status={photoStatus} />
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <div className="mt-4 flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-surface">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="size-full object-cover" />
              ) : (
                <UploadIcon className="size-5 text-text-muted" />
              )}
            </span>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 rounded-panel border border-dashed border-neutral-border bg-neutral-surface px-4 py-2.5 text-sm font-medium text-text-charcoal transition-colors hover:bg-neutral-border/30"
            >
              <UploadIcon className="size-4.5" />
              {photoUrl ? "Change photo" : "Upload photo"}
            </button>
          </div>
        </section>

        {/* Government ID */}
        <section className="mt-4 rounded-card bg-background-white p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-charcoal">Government ID</h3>
                <ReqTag required />
              </div>
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

        <p className="mt-3 rounded-panel bg-neutral-surface px-4 py-3 text-xs text-text-muted">
          Your Nursing &amp; Midwifery Council (NMC) PIN is also required — add it on your{" "}
          <Link to="/profile" className="font-medium text-brand-red hover:underline">
            Profile
          </Link>
          .
        </p>

        {/* --- Optional --- */}
        <h2 className="mt-8 text-xs font-semibold tracking-wide text-text-muted uppercase">
          Optional
        </h2>

        {/* Certifications */}
        <section className="mt-3 rounded-card bg-background-white p-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-text-charcoal">Certifications &amp; licenses</h3>
            <ReqTag />
          </div>
          <p className="mt-1 text-sm text-text-muted">
            Nursing licenses, CPR, first aid, or any specialty certifications. These strengthen your
            profile but aren't required to get verified.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {certifications.length === 0 ? (
              <p className="text-sm text-text-muted">No certifications added yet.</p>
            ) : (
              certifications.map((cert) => (
                <div
                  key={cert.url}
                  className="flex items-center justify-between gap-3 rounded-panel bg-neutral-surface p-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <CheckCircleIcon className="size-4.5 shrink-0 text-verify-green" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-charcoal">{cert.name}</p>
                      <a
                        href={mediaUrl(cert.url) ?? cert.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-text-muted hover:text-brand-red hover:underline"
                      >
                        View file
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.url)}
                    aria-label={`Remove ${cert.name}`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-neutral-border/40 hover:text-brand-red"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <input
            ref={certInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={addCertification}
          />
          <button
            type="button"
            disabled={savingCert}
            onClick={() => certInputRef.current?.click()}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-1.5 rounded-panel border border-dashed border-neutral-border p-3 text-sm font-medium text-text-muted transition-colors hover:bg-neutral-surface hover:text-text-charcoal disabled:opacity-50"
            )}
          >
            <AddIcon className="size-4" />
            {savingCert ? "Uploading…" : "Add certification"}
          </button>
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

function ReqTag({ required }: { required?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
        required ? "bg-brand-red-tint text-brand-red" : "bg-neutral-surface text-text-muted"
      )}
    >
      {required ? "Required" : "Optional"}
    </span>
  )
}
