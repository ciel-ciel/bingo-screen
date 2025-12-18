// src/app/page.tsx
import Link from "next/link"

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Bingo Screen</h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>
          開く画面を選択してください。
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <Link
            href="/admin"
            style={{
              display: "block",
              padding: "16px 18px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              textDecoration: "none",
              fontSize: 18,
            }}
          >
            Admin
          </Link>

          <Link
            href="/display"
            style={{
              display: "block",
              padding: "16px 18px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              textDecoration: "none",
              fontSize: 18,
            }}
          >
            Display
          </Link>
        </div>
      </div>
    </main>
  )
}
