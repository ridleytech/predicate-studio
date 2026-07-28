import { ethers } from 'ethers'
import type { Authorization } from '@/types/authorization'

export const predicateProtectedActionAbi = [
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'schemaVersion', type: 'uint256' },
          { internalType: 'address', name: 'subject', type: 'address' },
          { internalType: 'uint256', name: 'amountWei', type: 'uint256' },
          { internalType: 'bytes32', name: 'nonce', type: 'bytes32' },
          { internalType: 'uint64', name: 'expiresAt', type: 'uint64' },
          { internalType: 'bytes32', name: 'policyIdHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'evaluationIdHash', type: 'bytes32' },
          { internalType: 'address', name: 'contractAddress', type: 'address' },
          { internalType: 'uint256', name: 'chainId', type: 'uint256' },
        ],
        internalType: 'struct PredicateProtectedAction.Authorization',
        name: 'auth',
        type: 'tuple',
      },
      { internalType: 'bytes', name: 'signature', type: 'bytes' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export async function getBrowserSigner() {
  const anyWindow = window as any
  if (!anyWindow.ethereum) {
    throw new Error('No injected wallet found (MetaMask)')
  }
  const provider = new ethers.BrowserProvider(anyWindow.ethereum)
  await provider.send('eth_requestAccounts', [])
  return await provider.getSigner()
}

export function toContractAuth(auth: Authorization) {
  return {
    schemaVersion: BigInt(auth.schemaVersion),
    subject: auth.subject,
    amountWei: ethers.parseEther(String(auth.amount)),
    nonce: auth.nonce,
    expiresAt: BigInt(Math.floor(new Date(auth.expiresAt).getTime() / 1000)),
    policyIdHash: auth.policyIdHash,
    evaluationIdHash: auth.evaluationIdHash,
    contractAddress: auth.contractAddress,
    chainId: BigInt(auth.chainId),
  }
}
