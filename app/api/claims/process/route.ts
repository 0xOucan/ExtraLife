import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ClaimService, PolicyService, BeneficiaryService } from '@/lib/services/database'
import { junoClient } from '@/lib/juno/client'
import { isMock } from '@/lib/config'

// Validation schema for claim creation - updated to match frontend structure
const createClaimSchema = z.object({
  policy_number: z.string().min(1, 'Policy number is required'),
  beneficiary_clabe: z.string().min(1, 'Beneficiary CLABE is required'),
  amount: z.number().positive('Amount must be positive'),
  verification_id: z.string().min(1, 'Verification ID is required'),
  claimType: z.enum(['death']).default('death')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input data
    const validatedData = createClaimSchema.parse(body)
    
    // Find the policy
    const policy = await PolicyService.getPolicyByNumber(validatedData.policy_number)
    if (!policy) {
      return NextResponse.json(
        { error: 'Policy not found' },
        { status: 404 }
      )
    }
    
    // Check if policy is active
    if (policy.status !== 'active') {
      return NextResponse.json(
        { error: 'Policy must be active to file a claim' },
        { status: 400 }
      )
    }
    
    // Get beneficiaries
    const beneficiaries = await BeneficiaryService.getBeneficiariesByPolicy(policy.id)
    if (beneficiaries.length === 0) {
      return NextResponse.json(
        { error: 'No beneficiaries found for this policy' },
        { status: 400 }
      )
    }
    
    // Create the claim
    const claim = await ClaimService.createClaim({
      policyId: policy.id,
      claimType: validatedData.claimType,
      claimAmount: validatedData.amount,
      deathCertificateUrl: `verification://${validatedData.verification_id}`, // Use verification ID as reference
      additionalDocuments: [],
      status: 'approved' // Auto-approve for demo since documents are pre-verified
    })

    // In mock mode, simulate successful blockchain transaction
    if (isMock) {
      const mockTransaction = {
        id: `tx_${Date.now()}`,
        amount: validatedData.amount,
        currency: 'MXNB',
        beneficiary_clabe: validatedData.beneficiary_clabe,
        status: 'completed',
        timestamp: new Date().toISOString()
      }

      // Update claim as paid
      await ClaimService.updateClaim(claim.id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        transactionId: mockTransaction.id
      })

      return NextResponse.json({
        success: true,
        data: {
          amount: validatedData.amount,
          currency: 'MXNB',
          beneficiary_clabe: validatedData.beneficiary_clabe,
          juno_transaction_id: mockTransaction.id,
          claim_id: claim.id,
          status: 'paid',
          message: 'Claim processed successfully and payment sent to beneficiary'
        }
      })
    }

    // For production mode, implement actual Juno API calls
    return NextResponse.json({
      success: true,
      data: {
        claim,
        policy: {
          id: policy.id,
          policyNumber: policy.policyNumber,
          coverageAmount: policy.coverageAmount,
          policyHolder: `${policy.firstName} ${policy.lastName}`
        },
        beneficiaries: beneficiaries.map(b => ({
          id: b.id,
          name: `${b.firstName} ${b.lastName}`,
          relationship: b.relationship,
          percentage: b.percentage,
          claimAmount: Math.round(policy.coverageAmount * (b.percentage / 100))
        })),
        nextSteps: [
          'Your claim has been submitted for review',
          'Our team will verify the documentation within 5-7 business days',
          'You will receive email updates on the claim status',
          'Upon approval, payments will be processed to beneficiaries'
        ]
      }
    })
    
  } catch (error) {
    console.error('Error processing claim:', error)
    
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

// Update claim status (for admin use)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('id')
    
    if (!claimId) {
      return NextResponse.json(
        { error: 'Claim ID is required' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { status, reviewNotes } = body
    
    // Validate status
    const validStatuses = ['submitted', 'under_review', 'approved', 'rejected', 'paid']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    // Update claim
    const updatedClaim = await ClaimService.updateClaim(claimId, {
      status,
      reviewNotes,
      reviewedAt: new Date().toISOString()
    })
    
    if (!updatedClaim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }
    
    // If approved, trigger payment process
    if (status === 'approved' && !isMock) {
      try {
        // Get policy and beneficiaries
        const policy = await PolicyService.getPolicyById(updatedClaim.policyId)
        const beneficiaries = await BeneficiaryService.getBeneficiariesByPolicy(updatedClaim.policyId)
        
        if (policy && beneficiaries.length > 0) {
          // In a real implementation, this would trigger MXNB redemption and payments
          // For now, we'll just log the action
          console.log('Payment process triggered for claim:', claimId)
          
          // Update claim to paid status
          await ClaimService.updateClaim(claimId, {
            status: 'paid',
            paidAt: new Date().toISOString(),
            transactionId: `tx_${Date.now()}`
          })
        }
      } catch (error) {
        console.error('Error processing payment:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedClaim
    })
    
  } catch (error) {
    console.error('Error updating claim:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
