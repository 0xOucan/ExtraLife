// Juno API types based on Bitso documentation

export interface JunoConfig {
  apiKey: string
  apiSecret: string
  baseUrl: string
  clabe?: string
}

// Authentication types
export interface JunoAuthHeaders {
  'Authorization': string
  'Bitso-Timestamp': string
  'Bitso-Signature': string
  'Content-Type': string
  [key: string]: string
}

// CLABE types
export interface CreateClabeRequest {
  alias?: string
}

export interface ClabeResponse {
  id: string
  clabe: string
  alias?: string
  status: 'active' | 'inactive'
  created_at: string
  deactivated_at?: string
}

export interface ListClabesResponse {
  clabes: ClabeResponse[]
  pagination?: {
    limit: number
    offset: number
    total: number
  }
}

// Deposit types
export interface DepositResponse {
  id: string
  clabe_id: string
  amount: string
  currency: 'MXN'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  reference?: string
  sender_name?: string
  sender_account?: string
}

export interface ListDepositsResponse {
  deposits: DepositResponse[]
  pagination?: {
    limit: number
    offset: number
    total: number
  }
}

// Mock deposit types
export interface CreateMockDepositRequest {
  clabe_id: string
  amount: string
  currency: 'MXN'
  reference?: string
  sender_name?: string
  sender_account?: string
}

// Issuance types (MXN -> MXNB)
export interface TriggerIssuanceRequest {
  deposit_id: string
  destination_address: string
  network: 'arbitrum' | 'ethereum'
}

export interface IssuanceResponse {
  id: string
  deposit_id: string
  amount: string
  currency: 'MXNB'
  destination_address: string
  network: string
  status: 'pending' | 'completed' | 'failed'
  transaction_hash?: string
  created_at: string
  completed_at?: string
}

// Redemption types (MXNB -> MXN)
export interface RedeemTokensRequest {
  amount: string
  token_address: string
  network: 'arbitrum' | 'ethereum'
  destination_clabe?: string
}

export interface RedemptionResponse {
  id: string
  amount: string
  currency: 'MXN'
  token_address: string
  network: string
  destination_clabe?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}

// Transaction types
export interface TransactionResponse {
  id: string
  type: 'deposit' | 'issuance' | 'redemption' | 'withdrawal'
  amount: string
  currency: 'MXN' | 'MXNB'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  metadata?: any
}

export interface ListTransactionsResponse {
  transactions: TransactionResponse[]
  pagination?: {
    limit: number
    offset: number
    total: number
  }
}

// Error types
export interface JunoError {
  error: {
    code: string
    message: string
    details?: any
  }
}

// Generic API response
export interface JunoApiResponse<T = any> {
  success: boolean
  data?: T
  error?: JunoError['error']
} 