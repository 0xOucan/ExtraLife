import { type NextRequest, NextResponse } from "next/server"

// Mock Juno API for CLABE creation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, reference } = body

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock CLABE generation (in real implementation, this would call Juno API)
    const mockClabe = {
      id: `clabe_${Date.now()}`,
      clabe: "646180157000000001", // Mock CLABE number
      bank_name: "STP",
      amount: amount,
      reference: reference,
      status: "active",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    }

    return NextResponse.json({
      success: true,
      data: mockClabe,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create CLABE" }, { status: 500 })
  }
}
