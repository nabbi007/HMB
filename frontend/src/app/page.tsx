import { checkApiHealth } from "@/lib/api";

export default async function Home() {
  // Server-side call to prove the API client + backend wiring works.
  const health = await checkApiHealth();

  return (
    <main style={{ padding: "1.5rem", flex: 1 }}>
      <h1 style={{ marginBottom: "0.25rem" }}>HelloMamaBetter</h1>
      <p style={{ color: "var(--color-muted)", marginTop: 0 }}>
        Your foster mother to walk you through life.
      </p>

      <section
        style={{
          marginTop: "2rem",
          padding: "1rem",
          borderRadius: "var(--radius)",
          background: "var(--color-surface)",
        }}
      >
        <strong>Backend status:</strong>{" "}
        <span>{health.ok ? `✅ ${health.status}` : `⚠️ unreachable (${health.error})`}</span>
      </section>

      <div style={{ marginTop: "2rem" }}>
        <button type="button">Get started</button>
      </div>
    </main>
  );
}
