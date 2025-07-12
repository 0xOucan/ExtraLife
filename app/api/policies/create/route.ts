import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PolicyService, BeneficiaryService } from '@/lib/services/database'
import { junoClient } from '@/lib/juno/client'
import { isMock } from '@/lib/config'

// Validation schema for policy creation
const createPolicySchema = z.object({
  // User Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  birthDate: z.string().min(1, 'Birth date is required'),
  gender: z.enum(['male', 'female', 'other']),
  
  // Address Information
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(5, 'Valid postal code is required'),
  
  // Policy Details
  coverageType: z.enum(['basic', 'standard', 'premium', 'platinum']),
  coverageAmount: z.number().min(1000, 'Minimum coverage is $1,000 MXN'),
  
  // Beneficiaries
  beneficiaries: z.array(z.object({
    firstName: z.string().min(1, 'Beneficiary first name is required'),
    lastName: z.string().min(1, 'Beneficiary last name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    percentage: z.number().min(1).max(100, 'Percentage must be between 1-100'),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    idType: z.string().optional(),
    idNumber: z.string().optional()
  })).min(1, 'At least one beneficiary is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = createPolicySchema.parse(body)
    
    // Validate beneficiaries total percentage equals 100%
    const totalPercentage = validatedData.beneficiaries.reduce((sum, b) => sum + b.percentage, 0)
    if (totalPercentage !== 100) {
      return NextResponse.json(
        { error: 'Beneficiaries percentages must total exactly 100%' },
        { status: 400 }
      )
    }
    
    // Calculate age from birth date
    const birthDate = new Date(validatedData.birthDate)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    
    // Calculate premium
    const premiumAmount = PolicyService.calculatePremium(
      validatedData.coverageType,
      validatedData.coverageAmount,
      age,
      validatedData.gender,
      validatedData.state
    )
    
    // Create CLABE for payment (if not in mock mode)
    let clabeId: string | undefined
    let clabeNumber: string | undefined
    
    if (!isMock) {
      try {
        const clabeResponse = await junoClient.createClabe({
          alias: `Policy-${validatedData.firstName}-${validatedData.lastName}`
        })
        
        if (clabeResponse.success && clabeResponse.data) {
          clabeId = clabeResponse.data.id
          clabeNumber = clabeResponse.data.clabe
        }
      } catch (error) {
        console.error('Failed to create CLABE:', error)
        // Continue without CLABE in case of error
      }
    }
    
    // Create policy
    const policy = await PolicyService.createPolicy({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      birthDate: validatedData.birthDate,
      gender: validatedData.gender,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      postalCode: validatedData.postalCode,
      coverageType: validatedData.coverageType,
      coverageAmount: validatedData.coverageAmount,
      premiumAmount,
      paymentMethod: clabeId ? 'clabe' : undefined,
      clabeId,
      status: 'pending'
    })
    
    // Create beneficiaries
    const beneficiaries = await Promise.all(
      validatedData.beneficiaries.map(beneficiaryData =>
        BeneficiaryService.createBeneficiary({
          policyId: policy.id,
          firstName: beneficiaryData.firstName,
          lastName: beneficiaryData.lastName,
          relationship: beneficiaryData.relationship,
          percentage: beneficiaryData.percentage,
          email: beneficiaryData.email,
          phone: beneficiaryData.phone,
          idType: beneficiaryData.idType,
          idNumber: beneficiaryData.idNumber
        })
      )
    )
    
    return NextResponse.json({
      success: true,
      data: {
        policy,
        beneficiaries,
        payment: clabeId ? {
          clabeId,
          clabeNumber,
          amount: premiumAmount,
          instructions: 'Transfer the premium amount to the provided CLABE to activate your policy'
        } : {
          amount: premiumAmount,
          instructions: 'Policy created successfully. Payment processing in mock mode.'
        }
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