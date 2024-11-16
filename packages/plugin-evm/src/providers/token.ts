import { type PublicClient, formatUnits } from 'viem'
import { LiFi } from '@lifi/sdk'
import type { Token } from '@lifi/sdk'
import { CHAIN_CONFIGS } from './wallet'

export class TokenProvider {
  private lifi: LiFi

  constructor(private publicClients: Record<string, PublicClient>) {
    this.lifi = new LiFi({
      integrator: 'eliza-evm-plugin'
    })
  }

  async getTokenBalance(params: {
    chain: 'ethereum' | 'base'
    tokenAddress: string
    walletAddress: string
  }): Promise<bigint> {
    const client = this.publicClients[params.chain]
    if (!client) throw new Error(`No client found for chain: ${params.chain}`)

    const balance = await client.readContract({
      address: params.tokenAddress as `0x${string}`,
      abi: [{
        name: 'balanceOf',
        type: 'function',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }],
        stateMutability: 'view'
      }],
      functionName: 'balanceOf',
      args: [params.walletAddress as `0x${string}`]
    })

    return balance
  }

  async getTokenData(chain: 'ethereum' | 'base', tokenAddress: string): Promise<Token> {
    const token = await this.lifi.getToken(CHAIN_CONFIGS[chain].chainId, tokenAddress)
    if (!token) throw new Error(`Token not found: ${tokenAddress} on ${chain}`)
    return token
  }

  async getTokens(chain: 'ethereum' | 'base'): Promise<Token[]> {
    return await this.lifi.getTokens({
      chains: [CHAIN_CONFIGS[chain].chainId],
      include: ['POPULAR']
    })
  }
}