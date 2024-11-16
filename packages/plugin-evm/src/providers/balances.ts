import { formatUnits } from 'viem'
import type { Token } from '@lifi/types' // why is this not being used???
import { CHAIN_CONFIGS } from './wallet'
import type { TokenProvider } from './token'
import BigNumber from 'bignumber.js' // are we positive that this is the right library to use?

const PROVIDER_CONFIG = {
  PRICE_API: 'https://li.quest/v1',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  NATIVE_TOKEN: {
    ethereum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // this is wrong, FIX
    base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // this is wrong, FIX
  }
}

interface TokenBalance {
  symbol: string
  address: string
  balance: string
  decimals: number
  priceUSD: string
  valueUSD: string
}

interface WalletBalance {
  chain: string
  totalValueUSD: string
  tokens: TokenBalance[]
}

export class BalancesProvider {
  private priceCache: Map<string, { price: string; timestamp: number }> = new Map()

  constructor(
    private tokenProvider: TokenProvider,
    private walletAddress: string
  ) {}

  private async getTokenPrice(chain: string, tokenAddress: string): Promise<string> {
    const cacheKey = `${chain}-${tokenAddress}`
    const cached = this.priceCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < PROVIDER_CONFIG.CACHE_TTL) {
      return cached.price
    }

    try {
      const response = await fetch(
        `${PROVIDER_CONFIG.PRICE_API}/token?chain=${CHAIN_CONFIGS[chain].chainId}&token=${tokenAddress}`
      )
      const data = await response.json()
      const price = data.priceUSD || '0'
      
      this.priceCache.set(cacheKey, {
        price,
        timestamp: Date.now()
      })
      
      return price
    } catch (error) {
      console.error(`Failed to fetch price for ${tokenAddress} on ${chain}:`, error)
      return '0'
    }
  }

  async getWalletBalances(chains: ('ethereum' | 'base')[]): Promise<WalletBalance[]> {
    const balances = await Promise.all(
      chains.map(async (chain) => {
        const tokens = await this.tokenProvider.getTokens(chain)
        
        const tokenBalances = await Promise.all(
          tokens.map(async (token) => {
            const [balance, priceUSD] = await Promise.all([
              this.tokenProvider.getTokenBalance({
                chain,
                tokenAddress: token.address,
                walletAddress: this.walletAddress
              }),
              this.getTokenPrice(chain, token.address)
            ])

            const formattedBalance = formatUnits(balance, token.decimals)
            const valueUSD = new BigNumber(formattedBalance)
              .times(priceUSD)
              .toString()

            return {
              symbol: token.symbol,
              address: token.address,
              balance: formattedBalance,
              decimals: token.decimals,
              priceUSD,
              valueUSD
            }
          })
        )

        const nonZeroBalances = tokenBalances.filter(t => Number(t.balance) > 0)
        const totalValueUSD = nonZeroBalances
          .reduce((sum, t) => sum.plus(t.valueUSD), new BigNumber(0))
          .toString()

        return {
          chain,
          totalValueUSD,
          tokens: nonZeroBalances
        }
      })
    )

    return balances
  }
}