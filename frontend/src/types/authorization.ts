export type Authorization = {
  schemaVersion: number
  subject: string
  amount: number
  nonce: string
  expiresAt: string
  policyIdHash: string
  evaluationIdHash: string
  contractAddress: string
  chainId: number
}

export type AuthorizeResponse = {
  authorization: Authorization
  signature: string
}
