import { createPublicClient, createWalletClient, http, custom, type PublicClient, type WalletClient } from 'viem'
import { mainnet, base } from 'viem/chains'
import type { Chain } from 'viem'

export interface EVMChainConfig {
  name: string
  chainId: number
  rpcUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorer: string
}

export const CHAIN_CONFIGS: Record<string, EVMChainConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://etherscan.io'
  },
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://base.llamarpc.com',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    blockExplorer: 'https://basescan.org'
  }
} as const

export class WalletProvider {
  private publicClients: Record<string, PublicClient>
  private walletClient?: WalletClient
  private currentChain: Chain
    getCurrentChain: any

  constructor(customRpcUrls?: { ethereum?: string; base?: string }) {
    this.currentChain = mainnet
    this.publicClients = {
      ethereum: createPublicClient({
        chain: mainnet,
        transport: http(customRpcUrls?.ethereum || CHAIN_CONFIGS.ethereum.rpcUrl)
      }),
      base: createPublicClient({
        chain: base,
        transport: http(customRpcUrls?.base || CHAIN_CONFIGS.base.rpcUrl)
      })
    }
  }
  async connect(): Promise<string> {
    if (typeof window === 'undefined') {
      throw new Error('No window object found')
    }

    const ethereum = (window as any).ethereum
    if (!ethereum) {
      throw new Error('No Ethereum provider found')
    }

    this.walletClient = createWalletClient({
      chain: this.currentChain,
      transport: custom(ethereum)
    })

    const [address] = await this.walletClient.getAddresses()
    return address
  }

  getPublicClient(chain: 'ethereum' | 'base'): PublicClient {
    const client = this.publicClients[chain]
    if (!client) throw new Error(`No client found for chain: ${chain}`)
    return client
  }

  getWalletClient(): WalletClient {
    if (!this.walletClient) throw new Error('Wallet not connected')
    return this.walletClient
  }

  async switchChain(chain: 'ethereum' | 'base'): Promise<void> {
    if (!this.walletClient) throw new Error('Wallet not connected')
    
    const targetChain = chain === 'ethereum' ? mainnet : base
    await this.walletClient.switchChain({ id: targetChain.id })
    
    this.currentChain = targetChain
  }
}