import { type NextRequest, NextResponse } from "next/server"

// Create insurance policy
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      gender,
      age,
      region,
      policyHolderName,
      beneficiaryName,
      policyHolderClabe,
      beneficiaryClabe,
      depositId,
      amount,
    } = body

    // Simulate policy creation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const policy = {
      id: `policy_${Date.now()}`,
      policy_number: `EL-${Date.now().toString().slice(-8)}`,
      status: "active",
      coverage_amount: 1000000,
      premium_paid: amount,
      policy_holder: {
        name: policyHolderName,
        clabe: policyHolderClabe,
        gender: gender,
        age: age,
        region: region,
      },
      beneficiary: {
        name: beneficiaryName,
        clabe: beneficiaryClabe,
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    }

    return NextResponse.json({
      success: true,
      data: policy,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create policy" }, { status: 500 })
  }
}
