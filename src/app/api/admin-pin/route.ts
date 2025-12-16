import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  const correct = process.env.ADMIN_PIN ?? "";
  if (String(pin) === String(correct) && correct.length > 0) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
