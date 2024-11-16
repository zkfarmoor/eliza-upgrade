import { parseEther, type Hash, type ByteArray } from 'viem'
import type { WalletProvider } from '../providers/wallet'
import type { Transaction, TransferParams } from '../types'

export class TransferAction {
  constructor(private walletProvider: WalletProvider) {}

  async transfer(params: TransferParams): Promise<Transaction> {
    const walletClient = this.walletProvider.getWalletClient()
    const [from] = await walletClient.getAddresses()

    // Switch to correct chain if needed
    if (this.walletProvider.getCurrentChain().id !== params.fromChain) {
      await this.walletProvider.switchChain(params.fromChain)
    }

    // Prepare transaction parameters
    const txParams = {
      to: params.toAddress,
      value: parseEther(params.amount),
      data: params.data,
      // Add kzg for EIP-4844 compatibility
      kzg: {
        blobToKzgCommitment: (blob: ByteArray): ByteArray => blob,
        computeBlobKzgProof: (blob: ByteArray, commitment: ByteArray): ByteArray => blob
      }
    } as const

    const hash = await walletClient.sendTransaction(txParams)

    return {
      hash,
      from,
      to: params.toAddress,
      value: parseEther(params.amount),
      data: params.data
    }
  }
}