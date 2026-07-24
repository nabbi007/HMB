export function MapTokenNotice() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-neutral-surface px-6">
      <div className="max-w-sm rounded-panel border border-neutral-border bg-background-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-text-charcoal">Map token missing</p>
        <p className="mt-2 text-sm text-text-muted">
          Add a Mapbox public token to <code className="font-mono">.env.local</code> as{" "}
          <code className="font-mono">VITE_MAPBOX_TOKEN</code>, then restart the dev server. Get a
          free token at{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
            className="text-brand-red underline"
          >
            account.mapbox.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}
