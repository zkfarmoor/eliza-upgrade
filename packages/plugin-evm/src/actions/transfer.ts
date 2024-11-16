import { ByteArray, parseEther, type Hex } from 'viem'
import type { WalletProvider } from '../providers/wallet'
import type { Transaction, TransferParams } from '../types'

export class TransferAction {
  constructor(private walletProvider: WalletProvider) {}

  async transfer(params: TransferParams): Promise<Transaction> {
    const walletClient = this.walletProvider.getWalletClient()
    const [fromAddress] = await walletClient.getAddresses()

    await this.walletProvider.switchChain(params.fromChain)

    try {
      const hash = await walletClient.sendTransaction({
        account: fromAddress,
        to: params.toAddress,
        value: parseEther(params.amount),
        data: params.data as Hex,
        kzg: {
          blobToKzgCommitment: function (blob: ByteArray): ByteArray {
            throw new Error('Function not implemented.')
          },
          computeBlobKzgProof: function (blob: ByteArray, commitment: ByteArray): ByteArray {
            throw new Error('Function not implemented.')
          }
        },
        chain: undefined
      })

      return {
        hash,
        from: fromAddress,
        to: params.toAddress,
        value: parseEther(params.amount),
        data: params.data as Hex
      }
    } catch (error) {
      throw new Error(`Transfer failed: ${error.message}`)
    }
  }
}