import { NextRequest, NextResponse } from 'next/server'
import { PolicyService } from '@/lib/services/database'
import { policyActivator } from '@/lib/services/policy-activator'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const policyNumber = searchParams.get('policy_number')

    if (!policyNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Policy number is required' 
      }, { status: 400 })
    }

    // Get policy from database
    const policy = await PolicyService.getPolicyByNumber(policyNumber)
    
    if (!policy) {
      return NextResponse.json({ 
        success: false, 
        error: 'Policy not found' 
      }, { status: 404 })
    }

    // Get activation time remaining
    const activationTimeRemaining = await policyActivator.getActivationTimeRemaining(policy.id)
    
    // Convert to seconds
    const remainingSeconds = Math.ceil(activationTimeRemaining / 1000)
    
    return NextResponse.json({
      success: true,
      policy: {
        policyNumber: policy.policyNumber,
        status: policy.status,
        createdAt: policy.createdAt,
        activatedAt: policy.activatedAt,
        isActive: policy.status === 'active',
        activationTimeRemaining: remainingSeconds,
        canFileClaims: policy.status === 'active'
      }
    })
  } catch (error) {
    console.error('Error checking policy status:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 