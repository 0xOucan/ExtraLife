import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { upload_id, policy_number } = body

    if (!upload_id || !policy_number) {
      return NextResponse.json({ success: false, error: "Upload ID and policy number are required" }, { status: 400 })
    }

    // Simulate document verification process
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Mock verification result (always successful for demo)
    const verificationResult = {
      id: `verification_${Date.now()}`,
      upload_id: upload_id,
      policy_number: policy_number,
      status: "verified",
      document_type: "death_certificate",
      verified_at: new Date().toISOString(),
      verification_details: {
        document_valid: true,
        signatures_verified: true,
        issuer_verified: true,
      },
    }

    return NextResponse.json({
      success: true,
      data: verificationResult,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to verify document" }, { status: 500 })
  }
}
