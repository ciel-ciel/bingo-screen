"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Draw = {
  id: number;
  session_id: string;
  number: number;
  created_at: string;
};

const SESSION = process.env.NEXT_PUBLIC_BINGO_SESSION!;

export default function DisplayPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const latest = draws[0]?.number ?? null;

  const hitSet = useMemo(() => new Set(draws.map(d => d.number)), [draws]);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("bingo_draws")
      .select("*")
      .eq("session_id", SESSION)
      .order("created_at", { ascending: false });

    if (!error && data) setDraws(data as Draw[]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      await refresh();
      if (cancelled) return;
    };

    init();

    const ch = supabase
      .channel("bingo_draws_changes_display")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bingo_draws" },
        payload => {
          const row = payload.new as Draw | null;
          const oldRow = payload.old as Draw | null;
          const sid = (row?.session_id ?? oldRow?.session_id) as string | undefined;
          if (sid !== SESSION) return;
          refresh();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  return (
    <div style={{ minHeight: "100vh", padding: 24, display: "grid", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "stretch" }}>
        <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 20, opacity: 0.7 }}>最新</div>
          <div style={{ fontSize: 180, lineHeight: 1, fontWeight: 700 }}>
            {latest ?? "ー"}
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 20, opacity: 0.7 }}>履歴。新しい順</div>
          <div style={{ fontSize: 28, display: "flex", flexWrap: "wrap", gap: 12, marginTop: 12 }}>
            {draws.slice(0, 30).map(d => (
              <span
                key={d.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 999,
                  padding: "6px 14px"
                }}
              >
                {d.number}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 20, opacity: 0.7 }}>1から75</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 1fr)", gap: 8, marginTop: 12 }}>
          {Array.from({ length: 75 }, (_, i) => i + 1).map(n => {
            const hit = hitSet.has(n);
            return (
              <div
                key={n}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: "10px 0",
                  textAlign: "center",
                  fontSize: 18,
                  opacity: hit ? 1 : 0.25,
                  fontWeight: hit ? 700 : 400
                }}
              >
                {n}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
