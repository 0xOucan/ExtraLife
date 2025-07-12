import { config, isMock } from '../config'
import { generateAuthHeaders, validateJunoConfig, createRequestUrl, extractRequestPath } from './auth'
import {
  JunoConfig,
  JunoApiResponse,
  ClabeResponse,
  ListClabesResponse,
  CreateClabeRequest,
  DepositResponse,
  ListDepositsResponse,
  CreateMockDepositRequest,
  TriggerIssuanceRequest,
  IssuanceResponse,
  RedeemTokensRequest,
  RedemptionResponse,
  TransactionResponse,
  ListTransactionsResponse
} from './types'

export class JunoClient {
  private config: JunoConfig

  constructor(config?: Partial<JunoConfig>) {
    const junoConfig = {
      ...config,
      apiKey: config?.apiKey || process.env.JUNO_API_KEY || '',
      apiSecret: config?.apiSecret || process.env.JUNO_API_SECRET || '',
      baseUrl: config?.baseUrl || process.env.JUNO_BASE_URL || 'https://stage.buildwithjuno.com'
    }

    if (!validateJunoConfig(junoConfig)) {
      throw new Error('Invalid Juno configuration. Missing apiKey, apiSecret, or baseUrl.')
    }

    this.config = junoConfig
  }

  /**
   * Make authenticated request to Juno API
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<JunoApiResponse<T>> {
    if (isMock) {
      return this.handleMockRequest<T>(method, endpoint, body)
    }

    try {
      const url = createRequestUrl(this.config.baseUrl, endpoint)
      const requestPath = extractRequestPath(endpoint)
      const bodyString = body ? JSON.stringify(body) : ''
      
      const headers = generateAuthHeaders(this.config, method, requestPath, bodyString)
      
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body: bodyString || undefined
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || { code: 'HTTP_ERROR', message: `HTTP ${response.status}` }
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred'
        }
      }
    }
  }

  /**
   * Handle mock requests for development/testing
   */
  private async handleMockRequest<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<JunoApiResponse<T>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock responses based on endpoint
    if (endpoint.includes('/clabes') && method === 'POST') {
      return {
        success: true,
        data: {
          id: `clabe_${Date.now()}`,
          clabe: '646180111234567890',
          alias: body?.alias || 'Insurance CLABE',
          status: 'active',
          created_at: new Date().toISOString()
        } as T
      }
    }

    if (endpoint.includes('/clabes') && method === 'GET') {
      return {
        success: true,
        data: {
          clabes: [
            {
              id: 'clabe_mock_1',
              clabe: '646180111234567890',
              alias: 'Insurance CLABE',
              status: 'active',
              created_at: new Date().toISOString()
            }
          ]
        } as T
      }
    }

    if (endpoint.includes('/deposits/mock') && method === 'POST') {
      return {
        success: true,
        data: {
          id: `deposit_${Date.now()}`,
          clabe_id: body?.clabe_id,
          amount: body?.amount,
          currency: 'MXN',
          status: 'completed',
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          reference: body?.reference || 'MOCK_DEPOSIT',
          sender_name: body?.sender_name || 'Mock Sender'
        } as T
      }
    }

    if (endpoint.includes('/issuances') && method === 'POST') {
      return {
        success: true,
        data: {
          id: `issuance_${Date.now()}`,
          deposit_id: body?.deposit_id,
          amount: '1000.00',
          currency: 'MXNB',
          destination_address: body?.destination_address,
          network: body?.network || 'arbitrum',
          status: 'completed',
          transaction_hash: `0x${Date.now().toString(16)}`,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        } as T
      }
    }

    // Default mock response
    return {
      success: true,
      data: {} as T
    }
  }

  // CLABE operations
  async createClabe(request: CreateClabeRequest): Promise<JunoApiResponse<ClabeResponse>> {
    return this.makeRequest<ClabeResponse>('POST', '/clabes', request)
  }

  async getClabe(clabeId: string): Promise<JunoApiResponse<ClabeResponse>> {
    return this.makeRequest<ClabeResponse>('GET', `/clabes/${clabeId}`)
  }

  async listClabes(): Promise<JunoApiResponse<ListClabesResponse>> {
    return this.makeRequest<ListClabesResponse>('GET', '/clabes')
  }

  // Deposit operations
  async listDeposits(clabeId?: string): Promise<JunoApiResponse<ListDepositsResponse>> {
    const endpoint = clabeId ? `/deposits?clabe_id=${clabeId}` : '/deposits'
    return this.makeRequest<ListDepositsResponse>('GET', endpoint)
  }

  async createMockDeposit(request: CreateMockDepositRequest): Promise<JunoApiResponse<DepositResponse>> {
    return this.makeRequest<DepositResponse>('POST', '/deposits/mock', request)
  }

  // Issuance operations (MXN -> MXNB)
  async triggerIssuance(request: TriggerIssuanceRequest): Promise<JunoApiResponse<IssuanceResponse>> {
    return this.makeRequest<IssuanceResponse>('POST', '/issuances', request)
  }

  // Redemption operations (MXNB -> MXN)
  async redeemTokens(request: RedeemTokensRequest): Promise<JunoApiResponse<RedemptionResponse>> {
    return this.makeRequest<RedemptionResponse>('POST', '/redemptions', request)
  }

  // Transaction operations
  async listTransactions(): Promise<JunoApiResponse<ListTransactionsResponse>> {
    return this.makeRequest<ListTransactionsResponse>('GET', '/transactions')
  }

  async getTransaction(transactionId: string): Promise<JunoApiResponse<TransactionResponse>> {
    return this.makeRequest<TransactionResponse>('GET', `/transactions/${transactionId}`)
  }
}

// Export singleton instance
export const junoClient = new JunoClient({
  apiKey: config.juno.apiKey,
  apiSecret: config.juno.apiSecret,
  baseUrl: config.juno.baseUrl
}) 