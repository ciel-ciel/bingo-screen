"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type BingoDrawRow = {
  id: number
  session_id: string
  number: number
  created_at: string
}

type InsertPayload<T> = {
  new: T
}

const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL または NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。")
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export default function DisplayPage() {
  const searchParams = useSearchParams()
  const sessionId: string = searchParams.get("session") || "default"

  const supabase = useMemo<SupabaseClient>(() => createSupabaseBrowserClient(), [])

  const [latest, setLatest] = useState<BingoDrawRow | null>(null)
  const [history, setHistory] = useState<BingoDrawRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        setError(null)

        const { data, error } = await supabase
          .from("bingo_draws")
          .select("id,session_id,number,created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(76)

        if (error) throw error
        if (cancelled) return

        const rows = (data ?? []) as BingoDrawRow[]
        setLatest(rows[0] ?? null)
        setHistory(rows.slice(1))
      } catch (e: unknown) {
        if (cancelled) return
        if (e instanceof Error) {
          setError(e.message)
        } else {
          setError("読み込みに失敗しました。")
        }
      }
    }

    void load()

    const insertChannel = supabase
      .channel(`bingo_draws_insert_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bingo_draws",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: InsertPayload<BingoDrawRow>) => {
          const row = payload.new

          setLatest((prevLatest) => {
            setHistory((prevHistory) => {
              const nextHistory = prevLatest ? [prevLatest, ...prevHistory] : [...prevHistory]
              return nextHistory.slice(0, 75)
            })
            return row
          })
        }
      )
      .subscribe()

    const deleteChannel = supabase
      .channel(`bingo_draws_delete_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bingo_draws",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          void load()
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(insertChannel)
      supabase.removeChannel(deleteChannel)
    }
  }, [supabase, sessionId])

  return (
    <main style={{ minHeight: "100vh", padding: 24, display: "grid", placeItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 16 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>Display</h1>
          <div style={{ opacity: 0.7, fontSize: 14 }}>session。{sessionId}</div>
        </header>

        {error ? (
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.15)",
              borderRadius: 16,
              padding: 16,
              background: "rgba(255,0,0,0.04)",
            }}
          >
            {error}
          </div>
        ) : null}

        <section
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 10 }}>最新の数字</div>
          <div
            style={{
              fontSize: 96,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: -2,
              textAlign: "center",
              padding: "12px 0",
            }}
          >
            {latest ? latest.number : "－"}
          </div>
          <div style={{ opacity: 0.6, fontSize: 12, textAlign: "center" }}>
            {latest ? new Date(latest.created_at).toLocaleString("ja-JP") : ""}
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 20,
            padding: 20,
          }}
        >
          <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 10 }}>過去の数字</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {history.length === 0 ? (
              <div style={{ opacity: 0.6 }}>まだ履歴がありません。</div>
            ) : (
              history.map((r) => (
                <div
                  key={r.id}
                  style={{
                    minWidth: 64,
                    padding: "10px 12px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    fontSize: 24,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {r.number}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
