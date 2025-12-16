import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = getSupabaseAdmin()
  const { id } = await params

  const { error } = await supabase.from("bingo_numbers").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
