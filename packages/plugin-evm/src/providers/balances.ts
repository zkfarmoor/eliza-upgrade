import { formatUnits } from 'viem'
import type { Token } from '@lifi/types'
import { CHAIN_CONFIGS } from './wallet'
import type { TokenProvider } from './token'

interface TokenBalance {
  symbol: string
  address: string
  balance: string
  decimals: number
  value?: string
}

interface WalletBalance {
  chain: string
  totalValue?: string
  tokens: TokenBalance[]
}

export class BalancesProvider {
  constructor(
    private tokenProvider: TokenProvider,
    private walletAddress: string
  ) {}

  async getWalletBalances(chains: ('ethereum' | 'base')[]): Promise<WalletBalance[]> {
    const balances = await Promise.all(
      chains.map(async (chain) => {
        const tokens = await this.tokenProvider.getTokens(chain)

        const tokenBalances = await Promise.all(
          tokens.map(async (token) => {
            const balance = await this.tokenProvider.getTokenBalance({
              chain,
              tokenAddress: token.address,
              walletAddress: this.walletAddress
            })

            return {
              symbol: token.symbol,
              address: token.address,
              balance: formatUnits(balance, token.decimals),
              decimals: token.decimals
            }
          })
        )

        return {
          chain,
          tokens: tokenBalances.filter(t => Number(t.balance) > 0)
        }
      })
    )

    return balances
  }
}