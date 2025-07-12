// Database schema types for Extra Life Insurance App

export interface Policy {
  id: string
  policyNumber: string
  
  // User Information
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  gender: 'male' | 'female' | 'other'
  
  // Address Information
  address: string
  city: string
  state: string
  postalCode: string
  
  // Policy Details
  coverageType: 'basic' | 'standard' | 'premium' | 'platinum'
  coverageAmount: number // in MXN
  premiumAmount: number // calculated premium
  
  // Payment Information
  paymentMethod?: string // clabe, card, etc.
  clabeId?: string // Juno CLABE ID
  
  // Policy Status
  status: 'pending' | 'active' | 'expired' | 'claimed'
  
  // Timestamps
  createdAt: string
  activatedAt?: string
  expiresAt?: string
}

export interface Beneficiary {
  id: string
  policyId: string
  
  // Beneficiary Information
  firstName: string
  lastName: string
  relationship: string // spouse, child, parent, sibling, other
  percentage: number // percentage of policy amount
  
  // Contact Information
  email?: string
  phone?: string
  address?: string
  
  // Identification
  idType?: string // curp, ine, passport
  idNumber?: string
  
  // Timestamps
  createdAt: string
}

export interface Claim {
  id: string
  claimNumber: string
  policyId: string
  
  // Claim Information
  claimType: 'death' | 'other'
  claimAmount: number
  
  // Documents
  deathCertificateUrl?: string
  additionalDocuments?: string[] // Array of document URLs
  
  // Claim Status
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid'
  reviewNotes?: string
  
  // Payment Information
  paymentMethod?: string // clabe, bank_transfer
  paymentDetails?: any // Object with payment info
  paidAt?: string
  transactionId?: string // Juno transaction ID
  
  // Timestamps
  createdAt: string
  reviewedAt?: string
}

export interface JunoTransaction {
  id: string
  policyId?: string
  claimId?: string
  
  // Transaction Details
  transactionType: 'deposit' | 'issuance' | 'redemption' | 'withdrawal'
  amount: number
  currency: 'MXN' | 'MXNB'
  
  // Juno Specific
  junoTransactionId?: string
  junoStatus?: 'pending' | 'completed' | 'failed'
  clabeId?: string
  
  // Metadata
  metadata?: any // Object with additional info
  
  // Timestamps
  createdAt: string
  completedAt?: string
}

export interface Clabe {
  id: string
  policyId?: string
  
  // CLABE Details
  clabeNumber: string
  alias?: string
  
  // Juno Details
  junoClabeId?: string
  
  // Status
  status: 'active' | 'inactive'
  
  // Timestamps
  createdAt: string
  deactivatedAt?: string
}

export interface SystemLog {
  id: string
  
  // Log Details
  level: 'info' | 'warning' | 'error'
  action: string
  entityType?: 'policy' | 'claim' | 'transaction'
  entityId?: string
  
  // Log Data
  message: string
  data?: any // Object with additional data
  
  // User Context
  userAgent?: string
  ipAddress?: string
  
  // Timestamp
  createdAt: string
}

// Database structure
export interface Database {
  policies: Policy[]
  beneficiaries: Beneficiary[]
  claims: Claim[]
  junoTransactions: JunoTransaction[]
  clabes: Clabe[]
  systemLogs: SystemLog[]
}

// Default database structure
export const defaultDatabase: Database = {
  policies: [],
  beneficiaries: [],
  claims: [],
  junoTransactions: [],
  clabes: [],
  systemLogs: []
} 