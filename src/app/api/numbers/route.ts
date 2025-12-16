import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../_lib/supabaseAdmin"

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin()

  const { sessionId, number } = await req.json()

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })
  }

  if (!Number.isInteger(number)) {
    return NextResponse.json({ error: "number must be integer" }, { status: 400 })
  }

  const { error } = await supabase.from("bingo_numbers").insert({
    session_id: sessionId,
    number,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
