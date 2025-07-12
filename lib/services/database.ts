import { v4 as uuidv4 } from 'uuid'
import { database, readDatabase, writeDatabase } from '../database/connection'
import { Policy, Beneficiary, Claim, JunoTransaction, SystemLog } from '../database/schema'
import { config } from '../config'

// Policy Services
export class PolicyService {
  static async createPolicy(policyData: Omit<Policy, 'id' | 'policyNumber' | 'createdAt'>): Promise<Policy> {
    const db = await readDatabase()
    
    const policy: Policy = {
      ...policyData,
      id: uuidv4(),
      policyNumber: this.generatePolicyNumber(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    
    db.policies.push(policy)
    await writeDatabase()
    
    // Log the action
    await SystemLogService.log('info', 'policy_created', 'policy', policy.id, 'New insurance policy created')
    
    return policy
  }
  
  static async getPolicyById(id: string): Promise<Policy | null> {
    const db = await readDatabase()
    return db.policies.find(p => p.id === id) || null
  }
  
  static async getPolicyByNumber(policyNumber: string): Promise<Policy | null> {
    const db = await readDatabase()
    return db.policies.find(p => p.policyNumber === policyNumber) || null
  }
  
  static async updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy | null> {
    const db = await readDatabase()
    const policyIndex = db.policies.findIndex(p => p.id === id)
    
    if (policyIndex === -1) return null
    
    db.policies[policyIndex] = { ...db.policies[policyIndex], ...updates }
    await writeDatabase()
    
    await SystemLogService.log('info', 'policy_updated', 'policy', id, 'Insurance policy updated')
    
    return db.policies[policyIndex]
  }
  
  static async listPolicies(filters?: { status?: Policy['status'], email?: string }): Promise<Policy[]> {
    const db = await readDatabase()
    let policies = db.policies
    
    if (filters?.status) {
      policies = policies.filter(p => p.status === filters.status)
    }
    
    if (filters?.email) {
      policies = policies.filter(p => p.email === filters.email)
    }
    
    return policies
  }
  
  static calculatePremium(
    coverageType: Policy['coverageType'],
    coverageAmount: number,
    age: number,
    gender: Policy['gender'],
    state: string
  ): number {
    const baseCoverage = config.insurance.baseCoverage[coverageType] || coverageAmount
    const baseRate = 0.05 // 5% base rate
    
    // Age multiplier
    let ageGroup: keyof typeof config.insurance.ageRates = '36-45'
    if (age <= 25) ageGroup = '18-25'
    else if (age <= 35) ageGroup = '26-35'
    else if (age <= 45) ageGroup = '36-45'
    else if (age <= 55) ageGroup = '46-55'
    else if (age <= 65) ageGroup = '56-65'
    else ageGroup = '66+'
    
    const ageMultiplier = config.insurance.ageRates[ageGroup]
    const genderMultiplier = config.insurance.genderRates[gender]
    const regionMultiplier = config.insurance.regionRates[state as keyof typeof config.insurance.regionRates] || config.insurance.regionRates.default
    
    return Math.round(baseCoverage * baseRate * ageMultiplier * genderMultiplier * regionMultiplier)
  }
  
  private static generatePolicyNumber(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `EL-${timestamp.slice(-8)}-${random}`
  }
}

// Beneficiary Services
export class BeneficiaryService {
  static async createBeneficiary(beneficiaryData: Omit<Beneficiary, 'id' | 'createdAt'>): Promise<Beneficiary> {
    const db = await readDatabase()
    
    // Validate that policy exists
    const policy = db.policies.find(p => p.id === beneficiaryData.policyId)
    if (!policy) {
      throw new Error('Policy not found')
    }
    
    // Validate total percentage doesn't exceed 100%
    const existingBeneficiaries = db.beneficiaries.filter(b => b.policyId === beneficiaryData.policyId)
    const totalPercentage = existingBeneficiaries.reduce((sum, b) => sum + b.percentage, 0) + beneficiaryData.percentage
    
    if (totalPercentage > 100) {
      throw new Error('Total beneficiary percentage cannot exceed 100%')
    }
    
    const beneficiary: Beneficiary = {
      ...beneficiaryData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    }
    
    db.beneficiaries.push(beneficiary)
    await writeDatabase()
    
    await SystemLogService.log('info', 'beneficiary_created', 'policy', beneficiaryData.policyId, 'New beneficiary added to policy')
    
    return beneficiary
  }
  
  static async getBeneficiariesByPolicy(policyId: string): Promise<Beneficiary[]> {
    const db = await readDatabase()
    return db.beneficiaries.filter(b => b.policyId === policyId)
  }
  
  static async updateBeneficiary(id: string, updates: Partial<Beneficiary>): Promise<Beneficiary | null> {
    const db = await readDatabase()
    const beneficiaryIndex = db.beneficiaries.findIndex(b => b.id === id)
    
    if (beneficiaryIndex === -1) return null
    
    db.beneficiaries[beneficiaryIndex] = { ...db.beneficiaries[beneficiaryIndex], ...updates }
    await writeDatabase()
    
    return db.beneficiaries[beneficiaryIndex]
  }
  
  static async deleteBeneficiary(id: string): Promise<boolean> {
    const db = await readDatabase()
    const beneficiaryIndex = db.beneficiaries.findIndex(b => b.id === id)
    
    if (beneficiaryIndex === -1) return false
    
    db.beneficiaries.splice(beneficiaryIndex, 1)
    await writeDatabase()
    
    return true
  }
}

// Claim Services
export class ClaimService {
  static async createClaim(claimData: Omit<Claim, 'id' | 'claimNumber' | 'createdAt'>): Promise<Claim> {
    const db = await readDatabase()
    
    // Validate that policy exists and is active
    const policy = db.policies.find(p => p.id === claimData.policyId)
    if (!policy) {
      throw new Error('Policy not found')
    }
    
    if (policy.status !== 'active') {
      throw new Error('Policy must be active to file a claim')
    }
    
    const claim: Claim = {
      ...claimData,
      id: uuidv4(),
      claimNumber: this.generateClaimNumber(),
      createdAt: new Date().toISOString(),
      status: 'submitted'
    }
    
    db.claims.push(claim)
    await writeDatabase()
    
    await SystemLogService.log('info', 'claim_created', 'claim', claim.id, 'New insurance claim submitted')
    
    return claim
  }
  
  static async getClaimById(id: string): Promise<Claim | null> {
    const db = await readDatabase()
    return db.claims.find(c => c.id === id) || null
  }
  
  static async getClaimByNumber(claimNumber: string): Promise<Claim | null> {
    const db = await readDatabase()
    return db.claims.find(c => c.claimNumber === claimNumber) || null
  }
  
  static async updateClaim(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    const db = await readDatabase()
    const claimIndex = db.claims.findIndex(c => c.id === id)
    
    if (claimIndex === -1) return null
    
    db.claims[claimIndex] = { ...db.claims[claimIndex], ...updates }
    await writeDatabase()
    
    await SystemLogService.log('info', 'claim_updated', 'claim', id, 'Insurance claim updated')
    
    return db.claims[claimIndex]
  }
  
  static async listClaims(filters?: { status?: Claim['status'], policyId?: string }): Promise<Claim[]> {
    const db = await readDatabase()
    let claims = db.claims
    
    if (filters?.status) {
      claims = claims.filter(c => c.status === filters.status)
    }
    
    if (filters?.policyId) {
      claims = claims.filter(c => c.policyId === filters.policyId)
    }
    
    return claims
  }
  
  private static generateClaimNumber(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `CL-${timestamp.slice(-8)}-${random}`
  }
}

// System Log Service
export class SystemLogService {
  static async log(
    level: SystemLog['level'],
    action: string,
    entityType?: SystemLog['entityType'],
    entityId?: string,
    message?: string,
    data?: any
  ): Promise<void> {
    const db = await readDatabase()
    
    const log: SystemLog = {
      id: uuidv4(),
      level,
      action,
      entityType,
      entityId,
      message: message || action,
      data,
      createdAt: new Date().toISOString()
    }
    
    db.systemLogs.push(log)
    await writeDatabase()
  }
  
  static async getLogs(filters?: {
    level?: SystemLog['level']
    entityType?: SystemLog['entityType']
    entityId?: string
    limit?: number
  }): Promise<SystemLog[]> {
    const db = await readDatabase()
    let logs = db.systemLogs
    
    if (filters?.level) {
      logs = logs.filter(l => l.level === filters.level)
    }
    
    if (filters?.entityType) {
      logs = logs.filter(l => l.entityType === filters.entityType)
    }
    
    if (filters?.entityId) {
      logs = logs.filter(l => l.entityId === filters.entityId)
    }
    
    // Sort by creation date (newest first)
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Apply limit
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit)
    }
    
    return logs
  }
} 