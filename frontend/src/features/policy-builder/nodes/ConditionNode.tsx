'use client'

import type { NodeProps } from 'reactflow'
import BaseNode from './BaseNode'
import type { ConditionData } from '../types'

export default function ConditionNode({ data }: NodeProps<ConditionData>) {
  return (
    <BaseNode title="Condition" subtitle={data.label}>
      <div className="text-slate-400">{data.conditionType}</div>
    </BaseNode>
  )
}
