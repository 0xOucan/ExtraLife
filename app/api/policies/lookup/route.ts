import { type NextRequest, NextResponse } from "next/server"
import { getLatestPolicyHash } from "@/lib/store/memory-store"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const policyNumber = searchParams.get("policy_number")

  if (!policyNumber) {
    return NextResponse.json({ success: false, error: "Policy number is required" }, { status: 400 })
  }

  const latestHash = getLatestPolicyHash()
  const storedHash = latestHash
  console.log("📥 Hash buscado:", policyNumber)
  console.log("📦 Último hash guardado:", storedHash)

  if (!latestHash || policyNumber !== latestHash) {
    return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 })
  }

  const mockPolicyData = {
    id: 1,
    policy_number: latestHash,
    status: "active",
    coverage_amount: "100000",
    premium_paid: "500",
    policy_holder: {
      name: "Plauto",
      clabe: "646180157000000000",
      gender: 1,
      age: 35,
      region: "CDMX",
    },
    beneficiary: {
      clabe: "646180157000000001",
      name: "Plautito",
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }

  return NextResponse.json({
    success: true,
    data: mockPolicyData,
  })
}
