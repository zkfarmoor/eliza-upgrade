import { LiFi } from '@lifi/sdk'
import type { WalletProvider } from '../providers/wallet'
import type { Transaction, BridgeParams, LiFiStatus } from '../types'
import { CHAIN_CONFIGS } from '../providers/wallet'

export class BridgeAction {
  private lifi: LiFi

  constructor(private walletProvider: WalletProvider) {
    this.lifi = new LiFi({
      integrator: 'eliza-evm-plugin'
    })
  }

  async bridge(params: BridgeParams): Promise<Transaction> {
    const [fromAddress] = await this.walletProvider.getWalletClient().getAddresses()

    await this.walletProvider.switchChain(params.fromChain)

    const { routes } = await this.lifi.getRoutes({
      fromChainId: CHAIN_CONFIGS[params.fromChain].chainId,
      toChainId: CHAIN_CONFIGS[params.toChain].chainId,
      fromTokenAddress: params.fromToken,
      toTokenAddress: params.toToken,
      fromAmount: params.amount,
      fromAddress,
      toAddress: params.toAddress,
      options: {
        slippage: 0.5,
        order: 'RECOMMENDED',
        allowSwitchChain: true
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
              throw new Error(`Bridge failed: ${status.error?.message || 'Unknown error'}`)
            }
          }
        }
      )

      return {
        hash: result.transactionHash,
        from: fromAddress,
        to: params.toAddress,
        value: BigInt(params.amount),
        data: result.transactionData
      }
    } catch (error) {
      throw new Error(`Bridge failed: ${error.message}`)
    }
  }
}