import { NextRequest, NextResponse } from "next/server"
import { savePolicyHash, getLatestPolicyHash } from "@/lib/store/memory-store"

// --- POST: guardar el hash ---
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { policyHash } = body

  if (!policyHash) {
    return NextResponse.json({ success: false, error: "Missing hash" }, { status: 400 })
  }

  savePolicyHash(policyHash) // ← nuevo nombre
  console.log("🔐 Hash guardado:", policyHash)
  return NextResponse.json({ success: true })
}

// --- GET: obtener el último hash guardado ---
export async function GET() {
  const lastHash = getLatestPolicyHash() // ← nuevo nombre

  if (!lastHash) {
    return NextResponse.json({ success: false, error: "No policy hash found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, policyHash: lastHash })
}