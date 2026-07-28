const API_BASE = (process.env.API_BASE_URL ?? 'http://127.0.0.1:8081').replace(/\/$/, '')
const SUBJECT = process.env.DEMO_SUBJECT ?? '0x58f84dE7f427459Cc5A8aa7c86FA7650A9834724'

async function apiFetch(path, init) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${init?.method ?? 'GET'} ${path} -> ${res.status} ${res.statusText}${text ? `\n${text}` : ''}`)
  }
  if (res.status === 204) return undefined
  return await res.json()
}

function node(id, type, x, y, data) {
  return { id, type, position: { x, y }, data }
}

function edge(id, source, target) {
  return { id, source, target }
}

function persistedPolicy(graph, compiled) {
  return {
    schemaVersion: 1,
    graph,
    compiled,
  }
}

async function createPolicy(name, policy) {
  return await apiFetch('/policies', {
    method: 'POST',
    body: JSON.stringify({ name, policy }),
  })
}

async function evaluate(policyId, transaction) {
  return await apiFetch('/evaluate', {
    method: 'POST',
    body: JSON.stringify({ policyId, transaction }),
  })
}

async function authorize(evaluationId, subject) {
  return await apiFetch('/authorize', {
    method: 'POST',
    body: JSON.stringify({ evaluationId, subject, ttlSeconds: 300 }),
  })
}

function buildPolicies() {
  const policies = []

  // 1) High value transfer gate: KYC + US + max amount <= 500
  {
    const t = 'trigger_kyc'
    const c1 = 'cond_kyc'
    const c2 = 'cond_country'
    const c3 = 'cond_max'
    const r = 'result_approve'

    const graph = {
      nodes: [
        node(t, 'trigger', 80, 140, { kind: 'trigger', label: 'Transaction Trigger' }),
        node(c1, 'condition', 280, 60, { kind: 'condition', label: 'Wallet is KYC verified', conditionType: 'wallet_kyc', params: {} }),
        node(c2, 'condition', 280, 160, { kind: 'condition', label: 'Country is US', conditionType: 'country', params: { country: 'US' } }),
        node(c3, 'condition', 280, 260, { kind: 'condition', label: 'Max amount 500', conditionType: 'max_amount', params: { max: 500 } }),
        node(r, 'result', 560, 160, { kind: 'result', label: 'Result', decision: 'APPROVE' }),
      ],
      edges: [
        edge('e1', t, c1),
        edge('e2', c1, c2),
        edge('e3', c2, c3),
        edge('e4', c3, r),
      ],
    }

    const compiled = {
      type: 'and',
      rules: [
        { type: 'condition', key: 'wallet_kyc', params: {} },
        {
          type: 'and',
          rules: [
            { type: 'condition', key: 'country', params: { country: 'US' } },
            {
              type: 'and',
              rules: [
                { type: 'condition', key: 'max_amount', params: { max: 500 } },
                { type: 'result', decision: 'APPROVE' },
              ],
            },
          ],
        },
      ],
    }

    policies.push({
      name: 'US KYC + Max Amount Gate',
      policy: persistedPolicy(graph, compiled),
      demoTxs: [
        {
          label: 'approved_small_us_kyc',
          tx: {
            amount: 125,
            wallet: { address: SUBJECT, kyc: true, country: 'US', riskScore: 12 },
          },
        },
        {
          label: 'denied_too_large',
          tx: {
            amount: 1500,
            wallet: { address: SUBJECT, kyc: true, country: 'US', riskScore: 12 },
          },
        },
      ],
      authorizeFrom: 'approved_small_us_kyc',
    })
  }

  // 2) VIP allow list bypass
  {
    const t = 'trigger_vip'
    const c = 'cond_allow'
    const r = 'result_approve'

    const allow = [
      SUBJECT,
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
    ]

    const graph = {
      nodes: [
        node(t, 'trigger', 80, 120, { kind: 'trigger', label: 'Transaction Trigger' }),
        node(c, 'condition', 280, 120, { kind: 'condition', label: 'VIP allow-list', conditionType: 'wallet_allow_list', params: { addresses: allow } }),
        node(r, 'result', 560, 120, { kind: 'result', label: 'Result', decision: 'APPROVE' }),
      ],
      edges: [edge('e1', t, c), edge('e2', c, r)],
    }

    const compiled = {
      type: 'and',
      rules: [
        { type: 'condition', key: 'wallet_allow_list', params: { addresses: allow } },
        { type: 'result', decision: 'APPROVE' },
      ],
    }

    policies.push({
      name: 'VIP Allow-List',
      policy: persistedPolicy(graph, compiled),
      demoTxs: [
        {
          label: 'approved_vip',
          tx: { amount: 999, wallet: { address: SUBJECT, kyc: false, country: 'FR', riskScore: 99 } },
        },
        {
          label: 'denied_not_vip',
          tx: { amount: 50, wallet: { address: '0x3333333333333333333333333333333333333333', kyc: true, country: 'US', riskScore: 5 } },
        },
      ],
    })
  }

  // 3) Deny-listed wallet block
  {
    const t = 'trigger_deny'
    const c = 'cond_deny'
    const r = 'result_approve'

    const denied = [
      '0xdeadbeef00000000000000000000000000000000',
      '0x9999999999999999999999999999999999999999',
    ]

    const graph = {
      nodes: [
        node(t, 'trigger', 80, 120, { kind: 'trigger', label: 'Transaction Trigger' }),
        node(c, 'condition', 280, 120, { kind: 'condition', label: 'Wallet not deny-listed', conditionType: 'wallet_deny_list', params: { addresses: denied } }),
        node(r, 'result', 560, 120, { kind: 'result', label: 'Result', decision: 'APPROVE' }),
      ],
      edges: [edge('e1', t, c), edge('e2', c, r)],
    }

    const compiled = {
      type: 'and',
      rules: [
        { type: 'condition', key: 'wallet_deny_list', params: { addresses: denied } },
        { type: 'result', decision: 'APPROVE' },
      ],
    }

    policies.push({
      name: 'Deny-List Block',
      policy: persistedPolicy(graph, compiled),
      demoTxs: [
        {
          label: 'approved_not_denied',
          tx: { amount: 10, wallet: { address: SUBJECT, kyc: true, country: 'US', riskScore: 1 } },
        },
        {
          label: 'denied_denied_wallet',
          tx: { amount: 10, wallet: { address: denied[0], kyc: true, country: 'US', riskScore: 1 } },
        },
      ],
    })
  }

  // 4) Low risk OR KYC (flexible policy)
  {
    const t = 'trigger_risk'
    const l = 'logic_or'
    const c1 = 'cond_risk'
    const c2 = 'cond_kyc'
    const r = 'result_approve'

    const graph = {
      nodes: [
        node(t, 'trigger', 80, 160, { kind: 'trigger', label: 'Transaction Trigger' }),
        node(l, 'logic', 280, 160, { kind: 'logic', label: 'OR', logicType: 'or' }),
        node(c1, 'condition', 520, 80, { kind: 'condition', label: 'Risk <= 20', conditionType: 'risk_score', params: { max: 20 } }),
        node(c2, 'condition', 520, 240, { kind: 'condition', label: 'Wallet is KYC verified', conditionType: 'wallet_kyc', params: {} }),
        node(r, 'result', 760, 160, { kind: 'result', label: 'Result', decision: 'APPROVE' }),
      ],
      edges: [
        edge('e1', t, l),
        edge('e2', l, c1),
        edge('e3', l, c2),
        edge('e4', c1, r),
        edge('e5', c2, r),
      ],
    }

    const compiled = {
      type: 'or',
      rules: [
        { type: 'and', rules: [{ type: 'condition', key: 'risk_score', params: { max: 20 } }, { type: 'result', decision: 'APPROVE' }] },
        { type: 'and', rules: [{ type: 'condition', key: 'wallet_kyc', params: {} }, { type: 'result', decision: 'APPROVE' }] },
      ],
    }

    policies.push({
      name: 'Low Risk OR KYC',
      policy: persistedPolicy(graph, compiled),
      demoTxs: [
        {
          label: 'approved_low_risk',
          tx: { amount: 75, wallet: { address: '0x4444444444444444444444444444444444444444', kyc: false, country: 'BR', riskScore: 10 } },
        },
        {
          label: 'approved_kyc_even_if_high_risk',
          tx: { amount: 75, wallet: { address: SUBJECT, kyc: true, country: 'BR', riskScore: 95 } },
        },
        {
          label: 'denied_high_risk_no_kyc',
          tx: { amount: 75, wallet: { address: '0x5555555555555555555555555555555555555555', kyc: false, country: 'BR', riskScore: 95 } },
        },
      ],
    })
  }

  return policies
}

async function main() {
  const policies = buildPolicies()

  console.log(`Seeding to ${API_BASE}`)
  console.log(`Demo subject: ${SUBJECT}`)

  const created = []

  for (const p of policies) {
    const out = await createPolicy(p.name, p.policy)
    created.push({ ...p, id: out.id })
    console.log(`Created policy: ${out.name} (${out.id})`) 
  }

  const evaluations = []

  for (const p of created) {
    for (const txCase of p.demoTxs) {
      const ev = await evaluate(p.id, txCase.tx)
      evaluations.push({ policyName: p.name, label: txCase.label, evaluation: ev })
      console.log(`Evaluated ${p.name} -> ${txCase.label}: ${ev.decision}`)
    }
  }

  let authOut = null
  const authTarget = created.find((p) => p.authorizeFrom)
  if (authTarget) {
    const ev = evaluations.find((e) => e.policyName === authTarget.name && e.label === authTarget.authorizeFrom)
    if (ev && ev.evaluation?.decision === 'APPROVE') {
      authOut = await authorize(ev.evaluation.id, SUBJECT)
      console.log(`Generated authorization for evaluation ${ev.evaluation.id}`)
    }
  }

  console.log(
    JSON.stringify(
      {
        apiBaseUrl: API_BASE,
        demoSubject: SUBJECT,
        policies: created.map((p) => ({ name: p.name, id: p.id })),
        authorization: authOut,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
