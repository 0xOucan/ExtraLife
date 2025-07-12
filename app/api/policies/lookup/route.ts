import { type NextRequest, NextResponse } from "next/server"

// Mock policy database
const mockPolicies = [
  {
    id: 1,
    policy_number: "EL-00000001",
    status: "active",
    coverage_amount: 1000000,
    premium_paid: 10000,
    policy_holder: {
      name: "Juan Carlos Pérez García",
      clabe: "646180157000000001",
      gender: "male",
      age: 35,
      region: "Ciudad de México",
    },
    beneficiary: {
      clabe: "646180157000000002",
      name: "María González Pérez",
    },
    created_at: "2024-01-15T10:30:00Z",
    expires_at: "2025-01-15T10:30:00Z",
  },
  {
    id: 2,
    policy_number: "EL-00000002",
    status: "active",
    coverage_amount: 1000000,
    premium_paid: 12000,
    policy_holder: {
      name: "Ana Sofía Martínez López",
      clabe: "646180157000000003",
      gender: "female",
      age: 28,
      region: "Jalisco",
    },
    beneficiary: {
      clabe: "646180157000000004",
      name: "Carlos Rodríguez López",
    },
    created_at: "2024-02-20T14:15:00Z",
    expires_at: "2025-02-20T14:15:00Z",
  },
  {
    id: 3,
    policy_number: "EL-00000003",
    status: "active",
    coverage_amount: 1000000,
    premium_paid: 15000,
    policy_holder: {
      name: "Roberto Alejandro Hernández Silva",
      clabe: "646180157000000005",
      gender: "male",
      age: 42,
      region: "Nuevo León",
    },
    beneficiary: {
      clabe: "646180157000000006",
      name: "Ana Martínez Silva",
    },
    created_at: "2024-03-10T09:45:00Z",
    expires_at: "2025-03-10T09:45:00Z",
  },
  {
    id: 4,
    policy_number: "EL-00000004",
    status: "active",
    coverage_amount: 1000000,
    premium_paid: 8000,
    policy_holder: {
      name: "Claudia Patricia Ramírez Torres",
      clabe: "646180157000000007",
      gender: "female",
      age: 31,
      region: "Puebla",
    },
    beneficiary: {
      clabe: "646180157000000008",
      name: "José Luis Hernández",
    },
    created_at: "2024-04-05T16:20:00Z",
    expires_at: "2025-04-05T16:20:00Z",
  },
  {
    id: 5,
    policy_number: "EL-00000005",
    status: "active",
    coverage_amount: 1000000,
    premium_paid: 11000,
    policy_holder: {
      name: "Miguel Ángel Sánchez Morales",
      clabe: "646180157000000009",
      gender: "male",
      age: 39,
      region: "Veracruz",
    },
    beneficiary: {
      clabe: "646180157000000010",
      name: "Laura Sánchez Torres",
    },
    created_at: "2024-05-12T11:30:00Z",
    expires_at: "2025-05-12T11:30:00Z",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const policyNumber = searchParams.get("policy_number")

  if (!policyNumber) {
    return NextResponse.json({ success: false, error: "Policy number is required" }, { status: 400 })
  }

  try {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const policy = mockPolicies.find((p) => p.policy_number === policyNumber)

    if (!policy) {
      return NextResponse.json({ success: false, error: "Policy not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: policy,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to lookup policy" }, { status: 500 })
  }
}
