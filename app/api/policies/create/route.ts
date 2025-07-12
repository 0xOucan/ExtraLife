import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PolicyService, BeneficiaryService } from '@/lib/services/database'
import { junoClient } from '@/lib/juno/client'
import { isMock } from '@/lib/config'

// Simplified validation schema to match frontend data structure
const createPolicySchema = z.object({
  gender: z.enum(['male', 'female', 'other']),
  age: z.number().min(18, 'Must be at least 18 years old').max(99, 'Must be under 100 years old'),
  region: z.string().min(1, 'Region is required'),
  policyHolderName: z.string().min(1, 'Policy holder name is required'),
  beneficiaryName: z.string().min(1, 'Beneficiary name is required'),
  policyHolderClabe: z.string().min(18, 'Valid CLABE is required'),
  beneficiaryClabe: z.string().min(18, 'Valid beneficiary CLABE is required'),
  depositId: z.string().min(1, 'Deposit ID is required'),
  amount: z.number().positive('Amount must be positive')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = createPolicySchema.parse(body)
    
    // Parse names (handle cases where name might have multiple parts)
    const policyHolderParts = validatedData.policyHolderName.trim().split(' ')
    const beneficiaryParts = validatedData.beneficiaryName.trim().split(' ')
    
    const policyHolderFirstName = policyHolderParts[0] || 'Unknown'
    const policyHolderLastName = policyHolderParts.slice(1).join(' ') || 'User'
    
    const beneficiaryFirstName = beneficiaryParts[0] || 'Unknown'
    const beneficiaryLastName = beneficiaryParts.slice(1).join(' ') || 'Beneficiary'
    
    // Generate birth date from age
    const currentYear = new Date().getFullYear()
    const birthYear = currentYear - validatedData.age
    const birthDate = `${birthYear}-01-01` // Use January 1st as default
    
    // Determine coverage based on amount (simplified mapping)
    let coverageType: 'basic' | 'standard' | 'premium' | 'platinum'
    let coverageAmount: number
    
    if (validatedData.amount <= 5000) {
      coverageType = 'basic'
      coverageAmount = 100000
    } else if (validatedData.amount <= 10000) {
      coverageType = 'standard'
      coverageAmount = 250000
    } else if (validatedData.amount <= 20000) {
      coverageType = 'premium'
      coverageAmount = 500000
    } else {
      coverageType = 'platinum'
      coverageAmount = 1000000
    }
    
    // Calculate premium using our existing function
    const premiumAmount = PolicyService.calculatePremium(
      coverageType,
      coverageAmount,
      validatedData.age,
      validatedData.gender,
      validatedData.region
    )
    
    // Create policy with generated/default data
    const policy = await PolicyService.createPolicy({
      firstName: policyHolderFirstName,
      lastName: policyHolderLastName,
      email: `${policyHolderFirstName.toLowerCase()}@example.com`, // Default email
      phone: '5555551234', // Default phone
      birthDate,
      gender: validatedData.gender,
      address: 'Address not provided', // Default address
      city: 'Ciudad de México', // Default city
      state: validatedData.region,
      postalCode: '12345', // Default postal code
      coverageType,
      coverageAmount,
      premiumAmount,
      paymentMethod: 'clabe',
      clabeId: validatedData.depositId,
      status: 'pending' // Set to pending - will be activated after 40 seconds
    })
    
    // Create single beneficiary (simplified)
    const beneficiary = await BeneficiaryService.createBeneficiary({
      policyId: policy.id,
      firstName: beneficiaryFirstName,
      lastName: beneficiaryLastName,
      relationship: 'family', // Default relationship
      percentage: 100, // Single beneficiary gets 100%
      email: `${beneficiaryFirstName.toLowerCase()}@example.com`,
      phone: '5555555678',
      idType: 'national_id',
      idNumber: 'ID123456789'
    })
    
    return NextResponse.json({
      success: true,
      data: {
        policy_number: policy.policyNumber,
        status: 'active',
        coverage_amount: coverageAmount,
        premium_paid: premiumAmount,
        policy_holder: {
          name: validatedData.policyHolderName,
          clabe: validatedData.policyHolderClabe,
          gender: validatedData.gender,
          age: validatedData.age,
          region: validatedData.region
        },
        beneficiary: {
          name: validatedData.beneficiaryName,
          clabe: validatedData.beneficiaryClabe
        },
        created_at: policy.createdAt,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      }
    })
    
  } catch (error) {
    console.error('Error creating policy:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 