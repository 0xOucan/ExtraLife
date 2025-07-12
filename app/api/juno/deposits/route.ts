import { type NextRequest, NextResponse } from "next/server"

// Mock Juno API for checking deposits
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clabeId = searchParams.get("clabe_id")

  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Mock deposit verification (in real implementation, this would call Juno API)
    const mockDeposit = {
      id: `deposit_${Date.now()}`,
      clabe_id: clabeId,
      amount: 10000,
      currency: "MXNB",
      status: "completed",
      depositor_name: "Juan Pérez",
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: [mockDeposit],
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to check deposits" }, { status: 500 })
  }
}
