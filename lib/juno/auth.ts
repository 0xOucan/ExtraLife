import CryptoJS from 'crypto-js'
import { JunoAuthHeaders, JunoConfig } from './types'

/**
 * Generate HMAC signature for Juno API authentication
 * Based on Bitso's authentication documentation
 */
export function generateSignature(
  method: string,
  requestPath: string,
  timestamp: string,
  body: string,
  apiSecret: string
): string {
  // Create the message to sign: timestamp + method + requestPath + body
  const message = timestamp + method.toUpperCase() + requestPath + body
  
  // Generate HMAC-SHA256 signature
  const signature = CryptoJS.HmacSHA256(message, apiSecret).toString(CryptoJS.enc.Hex)
  
  return signature
}

/**
 * Generate authentication headers for Juno API requests
 */
export function generateAuthHeaders(
  config: JunoConfig,
  method: string,
  requestPath: string,
  body: string = ''
): JunoAuthHeaders {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = generateSignature(method, requestPath, timestamp, body, config.apiSecret)
  
  return {
    'Authorization': `Bitso ${config.apiKey}:${signature}`,
    'Bitso-Timestamp': timestamp,
    'Bitso-Signature': signature,
    'Content-Type': 'application/json'
  }
}

/**
 * Validate Juno API configuration
 */
export function validateJunoConfig(config: Partial<JunoConfig>): config is JunoConfig {
  return !!(
    config.apiKey &&
    config.apiSecret &&
    config.baseUrl
  )
}

/**
 * Create a complete request URL
 */
export function createRequestUrl(baseUrl: string, endpoint: string): string {
  return `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

/**
 * Extract request path from full URL for signature generation
 */
export function extractRequestPath(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search
  } catch {
    // If not a valid URL, assume it's already a path
    return url.startsWith('/') ? url : '/' + url
  }
} 