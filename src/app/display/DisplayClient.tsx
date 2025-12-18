"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

export default function DisplayClient() {
  const searchParams = useSearchParams();

  const roomId = useMemo(() => searchParams.get("room") ?? "", [searchParams]);

  return (
    <section>
      <h1>Display</h1>
      <p>room: {roomId || "none"}</p>

      {/* 既存の表示ロジックをここへ移植 */}
    </section>
  );
}
