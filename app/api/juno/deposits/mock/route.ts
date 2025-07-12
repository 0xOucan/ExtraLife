import { type NextRequest, NextResponse } from "next/server"

// Mock deposit creation for testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clabe_id, amount } = body

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const mockDeposit = {
      id: `mock_deposit_${Date.now()}`,
      clabe_id: clabe_id,
      amount: amount,
      currency: "MXNB",
      status: "completed",
      depositor_name: "Test User",
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: mockDeposit,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create mock deposit" }, { status: 500 })
  }
}
