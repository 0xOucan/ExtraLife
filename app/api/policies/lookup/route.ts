import { type NextRequest, NextResponse } from "next/server"
import { PolicyService, BeneficiaryService } from "@/lib/services/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const policyNumber = searchParams.get("policy_number")

  if (!policyNumber) {
    return NextResponse.json({ success: false, error: "Policy number is required" }, { status: 400 })
  }

  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Look up policy from actual database
    const policy = await PolicyService.getPolicyByNumber(policyNumber)

    if (!policy) {
      return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 })
    }

    // Get beneficiaries for this policy
    const beneficiaries = await BeneficiaryService.getBeneficiariesByPolicy(policy.id)
    const primaryBeneficiary = beneficiaries[0] // Get first beneficiary

    // Format response to match frontend expectations
    const responseData = {
      id: parseInt(policy.id.slice(-5), 16) || 1, // Convert UUID to number for compatibility
      policy_number: policy.policyNumber,
      status: policy.status,
      coverage_amount: policy.coverageAmount,
      premium_paid: policy.premiumAmount,
      policy_holder: {
        name: `${policy.firstName} ${policy.lastName}`,
        clabe: policy.clabeId || "646180157000000000", // Use actual CLABE or fallback
        gender: policy.gender,
        age: new Date().getFullYear() - new Date(policy.birthDate).getFullYear(),
        region: policy.state,
      },
      beneficiary: {
        clabe: "646180157000000001", // Would need to be stored in beneficiary if needed
        name: primaryBeneficiary ? `${primaryBeneficiary.firstName} ${primaryBeneficiary.lastName}` : "No beneficiary",
      },
      created_at: policy.createdAt,
      expires_at: new Date(new Date(policy.createdAt).getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error("Error looking up policy:", error)
    return NextResponse.json({ success: false, error: "Failed to lookup policy" }, { status: 500 })
  }
}
