import { LiFi } from '@lifi/sdk'
import type { WalletProvider } from '../providers/wallet'
import type { Transaction, SwapParams, LiFiStatus } from '../types'
import { CHAIN_CONFIGS } from '../providers/wallet'

export class SwapAction {
  private lifi: LiFi

  constructor(private walletProvider: WalletProvider) {
    this.lifi = new LiFi({
      integrator: 'eliza-evm-plugin'
    })
  }

  async swap(params: SwapParams): Promise<Transaction> {
    const [fromAddress] = await this.walletProvider.getWalletClient().getAddresses()

    await this.walletProvider.switchChain(params.chain)

    const { routes } = await this.lifi.getRoutes({
      fromChainId: CHAIN_CONFIGS[params.chain].chainId,
      toChainId: CHAIN_CONFIGS[params.chain].chainId,
      fromTokenAddress: params.fromToken,
      toTokenAddress: params.toToken,
      fromAmount: params.amount,
      fromAddress,
      options: {
        slippage: params.slippage || 0.5,
        order: 'RECOMMENDED'
      }
    })

    if (!routes.length) throw new Error('No routes found')

    try {
      const result = await this.lifi.executeRoute(
        this.walletProvider.getWalletClient(),
        routes[0],
        {
          updateCallback: (status: LiFiStatus) => {
            if (status.status === 'FAILED') {
              throw new Error(`Swap failed: ${status.error?.message || 'Unknown error'}`)
            }
          }
        }
      )

      return {
        hash: result.transactionHash,
        from: fromAddress,
        to: result.toAddress,
        value: BigInt(params.amount),
        data: result.transactionData
      }
    } catch (error) {
      throw new Error(`Swap failed: ${error.message}`)
    }
  }
}