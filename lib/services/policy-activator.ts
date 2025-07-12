import { PolicyService } from './database'
import { Policy } from '../database/schema'

class PolicyActivatorService {
  private intervalId: NodeJS.Timeout | null = null
  private readonly ACTIVATION_DELAY_MS = 40 * 1000 // 40 seconds
  private readonly CHECK_INTERVAL_MS = 5 * 1000 // Check every 5 seconds

  /**
   * Start the policy activation service
   */
  start() {
    if (this.intervalId) {
      console.log('Policy activator service is already running')
      return
    }

    console.log('🚀 Starting policy activator service (40 second delay)')
    
    this.intervalId = setInterval(async () => {
      try {
        await this.activatePendingPolicies()
      } catch (error) {
        console.error('Error in policy activator service:', error)
      }
    }, this.CHECK_INTERVAL_MS)
  }

  /**
   * Stop the policy activation service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('Policy activator service stopped')
    }
  }

  /**
   * Check for pending policies and activate those older than 40 seconds
   */
  private async activatePendingPolicies() {
    try {
      const allPolicies = await PolicyService.listPolicies()
      const pendingPolicies = allPolicies.filter((policy: Policy) => policy.status === 'pending')

      if (pendingPolicies.length === 0) {
        return // No pending policies to check
      }

      const now = new Date()
      let activatedCount = 0

      for (const policy of pendingPolicies) {
        const createdAt = new Date(policy.createdAt)
        const timeSinceCreation = now.getTime() - createdAt.getTime()

        if (timeSinceCreation >= this.ACTIVATION_DELAY_MS) {
          // Policy is older than 40 seconds, activate it
          await PolicyService.updatePolicy(policy.id, { 
            status: 'active',
            activatedAt: new Date().toISOString()
          })
          
          console.log(`✅ Policy ${policy.policyNumber} activated automatically (${Math.round(timeSinceCreation / 1000)}s old)`)
          activatedCount++
        }
      }

      if (activatedCount > 0) {
        console.log(`🎉 Activated ${activatedCount} policies automatically`)
      }
    } catch (error) {
      console.error('Error activating pending policies:', error)
    }
  }

  /**
   * Get the remaining time until a policy becomes active
   */
  async getActivationTimeRemaining(policyId: string): Promise<number> {
    try {
      const policy = await PolicyService.getPolicyById(policyId)
      if (!policy) {
        throw new Error('Policy not found')
      }

      if (policy.status === 'active') {
        return 0 // Already active
      }

      const createdAt = new Date(policy.createdAt)
      const now = new Date()
      const timeSinceCreation = now.getTime() - createdAt.getTime()
      const remainingTime = Math.max(0, this.ACTIVATION_DELAY_MS - timeSinceCreation)

      return remainingTime
    } catch (error) {
      console.error('Error getting activation time remaining:', error)
      return 0
    }
  }
}

// Export singleton instance
export const policyActivator = new PolicyActivatorService() 