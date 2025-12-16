"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Draw = {
  id: number;
  session_id: string;
  number: number;
  created_at: string;
};

const SESSION = process.env.NEXT_PUBLIC_BINGO_SESSION!;

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [ok, setOk] = useState(false);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [num, setNum] = useState<number | "">("");

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
      if (localStorage.getItem("admin_ok") === "1") setOk(true);
    };

    init();

    const ch = supabase
      .channel("bingo_draws_changes_admin")
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

  async function verify() {
    const res = await fetch("/api/admin-pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    });

    if (res.ok) {
      setOk(true);
      localStorage.setItem("admin_ok", "1");
    } else {
      alert("PINが違います。");
    }
  }

  async function addNumber(n: number) {
    const { error } = await supabase.from("bingo_draws").insert({
      session_id: SESSION,
      number: n
    });
    if (error) alert(error.message);
  }

  async function undoLatest() {
    const latest = draws[0];
    if (!latest) return;

    const { error } = await supabase.from("bingo_draws").delete().eq("id", latest.id);
    if (error) alert(error.message);
  }

  async function resetAll() {
    if (!confirm("全リセットします。OK。")) return;

    const { error } = await supabase.from("bingo_draws").delete().eq("session_id", SESSION);
    if (error) alert(error.message);
  }

  if (!ok) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ width: 360, border: "1px solid #ddd", borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 20, marginBottom: 12 }}>管理PIN</div>
          <input
            value={pin}
            onChange={e => setPin(e.target.value)}
            inputMode="numeric"
            style={{ width: "100%", padding: 12, fontSize: 18, border: "1px solid #ddd", borderRadius: 12 }}
          />
          <button
            onClick={verify}
            style={{
              width: "100%",
              marginTop: 12,
              padding: 12,
              fontSize: 18,
              borderRadius: 12,
              border: "1px solid #ddd",
              background: "white"
            }}
          >
            ログイン
          </button>
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            管理URLを参加者に共有しない運用にしてください。
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: 18, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={undoLatest} style={btnStyle}>直前取り消し</button>
        <button onClick={resetAll} style={btnStyle}>全リセット</button>
        <a
          href="/display"
          target="_blank"
          rel="noreferrer"
          style={{
            ...btnStyle,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          表示ページを開く
        </a>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={num}
          onChange={e => {
            const v = e.target.value;
            if (v === "") return setNum("");
            const n = Number(v);
            if (Number.isFinite(n)) setNum(n);
          }}
          inputMode="numeric"
          placeholder="数字を入力。1から75"
          style={{
            padding: 12,
            fontSize: 18,
            border: "1px solid #ddd",
            borderRadius: 12,
            width: 240
          }}
        />
        <button
          onClick={() => {
            if (num === "" || num < 1 || num > 75) return alert("1から75で入力してください。");
            addNumber(num);
            setNum("");
          }}
          style={btnStyle}
        >
          追加
        </button>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 12 }}>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 10 }}>タップで追加</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {Array.from({ length: 75 }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => addNumber(n)}
              style={{ ...btnStyle, padding: "16px 0" }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 16, padding: 12 }}>
        <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>最新から</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {draws.slice(0, 40).map(d => (
            <span
              key={d.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 999,
                padding: "6px 12px"
              }}
            >
              {d.number}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 16,
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white"
};
