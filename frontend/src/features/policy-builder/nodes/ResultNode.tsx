'use client'

import type { NodeProps } from 'reactflow'
import BaseNode from './BaseNode'
import type { ResultData } from '../types'

export default function ResultNode({ data }: NodeProps<ResultData>) {
  const tone = data.decision === 'APPROVE' ? 'success' : 'danger'
  return <BaseNode title="Result" subtitle={data.decision} tone={tone} />
}
