// lib/viem.ts
import { createPublicClient, createWalletClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const PRIVATE_KEY = process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY as `0x${string}`

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
})

const account = privateKeyToAccount(PRIVATE_KEY)

export const walletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(),
})

export const deployerAddress = account.address