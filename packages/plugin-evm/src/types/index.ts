import type { Address, Hash } from 'viem'

// Chain types
export type SupportedChain = 'ethereum' | 'base'

// Configuration types
export interface EvmPluginConfig {
  rpcUrl?: {
    ethereum?: string
    base?: string
  }
  testMode?: boolean
}

// Transaction types
export interface Transaction {
  hash: Hash
  from: Address
  to: Address
  value: bigint
  data?: `0x${string}`
}

export interface TransactionReceipt {
  transactionHash: Hash
  status: 'success' | 'reverted'
  blockNumber: bigint
  gasUsed: bigint
}

// Action parameter types
export interface TransferParams {
  fromChain: SupportedChain
  toAddress: Address
  amount: string
  data?: `0x${string}`
}

export interface BridgeParams {
  fromChain: SupportedChain
  toChain: SupportedChain
  fromToken: Address
  toToken: Address
  amount: string
  toAddress: Address
}

export interface SwapParams {
  chain: SupportedChain
  fromToken: Address
  toToken: Address
  amount: string
  slippage?: number
}

// Balance types
export interface TokenBalance {
  symbol: string
  address: Address
  balance: string
  decimals: number
  value?: string
}

export interface WalletBalance {
  chain: SupportedChain
  totalValue?: string
  tokens: TokenBalance[]
}

// LiFi types
export type LiFiStatus = {
  status: 'PENDING' | 'DONE' | 'FAILED'
  substatus?: string
  error?: Error
}

export type LiFiRoute = {
  transactionHash: Hash
  transactionData: `0x${string}`
  toAddress: Address
}

export type LiFiExecutionResult = {
  transactionHash: Hash
  transactionData: `0x${string}`
  toAddress: Address
  status: LiFiStatus
}

export type SwapContext = {
  fromToken: Address
  toToken: Address
  amount: string
  chain: SupportedChain
}