'use client'

import type { NodeProps } from 'reactflow'
import BaseNode from './BaseNode'
import type { LogicData } from '../types'

export default function LogicNode({ data }: NodeProps<LogicData>) {
  return <BaseNode title="Logic" subtitle={data.logicType.toUpperCase()} />
}
