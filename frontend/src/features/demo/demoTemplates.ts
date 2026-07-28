import type { PersistedPolicy } from "@/features/policy-builder/types";

function node(id: string, type: string, x: number, y: number, data: any) {
  return { id, type, position: { x, y }, data };
}

function edge(id: string, source: string, target: string) {
  return { id, source, target };
}

export type DemoTemplate = {
  name: string;
  description: string;
  policy: PersistedPolicy;
  examples: Array<{ label: string; tx: Record<string, unknown> }>;
};

export function getDemoTemplates(subjectAddress: string): DemoTemplate[] {
  const subject = subjectAddress;

  const templates: DemoTemplate[] = [];

  {
    const t = "trigger_kyc";
    const c1 = "cond_kyc";
    const c2 = "cond_country";
    const c3 = "cond_max";
    const r = "result_approve";

    const graph = {
      nodes: [
        node(t, "trigger", 80, 140, {
          kind: "trigger",
          label: "Transaction Trigger",
        }),
        node(c1, "condition", 280, 60, {
          kind: "condition",
          label: "Wallet is KYC verified",
          conditionType: "wallet_kyc",
          params: {},
        }),
        node(c2, "condition", 280, 160, {
          kind: "condition",
          label: "Country is US",
          conditionType: "country",
          params: { country: "US" },
        }),
        node(c3, "condition", 280, 260, {
          kind: "condition",
          label: "Max amount 500",
          conditionType: "max_amount",
          params: { max: 500 },
        }),
        node(r, "result", 560, 160, {
          kind: "result",
          label: "Result",
          decision: "APPROVE",
        }),
      ],
      edges: [
        edge("e1", t, c1),
        edge("e2", c1, c2),
        edge("e3", c2, c3),
        edge("e4", c3, r),
      ],
    };

    const compiled = {
      type: "and",
      rules: [
        { type: "condition", key: "wallet_kyc", params: {} },
        {
          type: "and",
          rules: [
            { type: "condition", key: "country", params: { country: "US" } },
            {
              type: "and",
              rules: [
                { type: "condition", key: "max_amount", params: { max: 500 } },
                { type: "result", decision: "APPROVE" },
              ],
            },
          ],
        },
      ],
    };

    templates.push({
      name: "US KYC + Max Amount Gate",
      description:
        "Approves only if the wallet is KYC verified, the wallet country is US, and the transaction amount is <= 500.",
      policy: {
        schemaVersion: 1,
        graph: graph as any,
        compiled: compiled as any,
      },
      examples: [
        {
          label: "Approved example",
          tx: {
            amount: 125,
            wallet: {
              address: subject,
              kyc: true,
              country: "US",
              riskScore: 12,
            },
          },
        },
        {
          label: "Denied example",
          tx: {
            amount: 1500,
            wallet: {
              address: subject,
              kyc: true,
              country: "US",
              riskScore: 12,
            },
          },
        },
      ],
    });
  }

  {
    const t = "trigger_vip";
    const c = "cond_allow";
    const r = "result_approve";

    const allow = [
      subject,
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
    ];

    const graph = {
      nodes: [
        node(t, "trigger", 80, 120, {
          kind: "trigger",
          label: "Transaction Trigger",
        }),
        node(c, "condition", 280, 120, {
          kind: "condition",
          label: "VIP allow-list",
          conditionType: "wallet_allow_list",
          params: { addresses: allow },
        }),
        node(r, "result", 560, 120, {
          kind: "result",
          label: "Result",
          decision: "APPROVE",
        }),
      ],
      edges: [edge("e1", t, c), edge("e2", c, r)],
    };

    const compiled = {
      type: "and",
      rules: [
        {
          type: "condition",
          key: "wallet_allow_list",
          params: { addresses: allow },
        },
        { type: "result", decision: "APPROVE" },
      ],
    };

    templates.push({
      name: "VIP Allow-List",
      description:
        "Approves if the wallet address is in an allow-list. Useful for VIP access or internal testing accounts.",
      policy: {
        schemaVersion: 1,
        graph: graph as any,
        compiled: compiled as any,
      },
      examples: [
        {
          label: "Approved example",
          tx: {
            amount: 999,
            wallet: {
              address: subject,
              kyc: false,
              country: "FR",
              riskScore: 99,
            },
          },
        },
        {
          label: "Denied example",
          tx: {
            amount: 50,
            wallet: {
              address: "0x3333333333333333333333333333333333333333",
              kyc: true,
              country: "US",
              riskScore: 5,
            },
          },
        },
      ],
    });
  }

  {
    const t = "trigger_deny";
    const c = "cond_deny";
    const r = "result_approve";

    const denied = [
      "0xdeadbeef00000000000000000000000000000000",
      "0x9999999999999999999999999999999999999999",
    ];

    const graph = {
      nodes: [
        node(t, "trigger", 80, 120, {
          kind: "trigger",
          label: "Transaction Trigger",
        }),
        node(c, "condition", 280, 120, {
          kind: "condition",
          label: "Wallet not deny-listed",
          conditionType: "wallet_deny_list",
          params: { addresses: denied },
        }),
        node(r, "result", 560, 120, {
          kind: "result",
          label: "Result",
          decision: "APPROVE",
        }),
      ],
      edges: [edge("e1", t, c), edge("e2", c, r)],
    };

    const compiled = {
      type: "and",
      rules: [
        {
          type: "condition",
          key: "wallet_deny_list",
          params: { addresses: denied },
        },
        { type: "result", decision: "APPROVE" },
      ],
    };

    templates.push({
      name: "Deny-List Block",
      description:
        "Approves only if the wallet address is NOT in a deny-list. Deny-listed wallets are blocked regardless of other fields.",
      policy: {
        schemaVersion: 1,
        graph: graph as any,
        compiled: compiled as any,
      },
      examples: [
        {
          label: "Approved example",
          tx: {
            amount: 10,
            wallet: {
              address: subject,
              kyc: true,
              country: "US",
              riskScore: 1,
            },
          },
        },
        {
          label: "Denied example",
          tx: {
            amount: 10,
            wallet: {
              address: denied[0]!,
              kyc: true,
              country: "US",
              riskScore: 1,
            },
          },
        },
      ],
    });
  }

  {
    const t = "trigger_risk";
    const l = "logic_or";
    const c1 = "cond_risk";
    const c2 = "cond_kyc";
    const r = "result_approve";

    const graph = {
      nodes: [
        node(t, "trigger", 80, 160, {
          kind: "trigger",
          label: "Transaction Trigger",
        }),
        node(l, "logic", 280, 160, {
          kind: "logic",
          label: "OR",
          logicType: "or",
        }),
        node(c1, "condition", 520, 80, {
          kind: "condition",
          label: "Risk <= 20",
          conditionType: "risk_score",
          params: { max: 20 },
        }),
        node(c2, "condition", 520, 240, {
          kind: "condition",
          label: "Wallet is KYC verified",
          conditionType: "wallet_kyc",
          params: {},
        }),
        node(r, "result", 760, 160, {
          kind: "result",
          label: "Result",
          decision: "APPROVE",
        }),
      ],
      edges: [
        edge("e1", t, l),
        edge("e2", l, c1),
        edge("e3", l, c2),
        edge("e4", c1, r),
        edge("e5", c2, r),
      ],
    };

    const compiled = {
      type: "or",
      rules: [
        {
          type: "and",
          rules: [
            { type: "condition", key: "risk_score", params: { max: 20 } },
            { type: "result", decision: "APPROVE" },
          ],
        },
        {
          type: "and",
          rules: [
            { type: "condition", key: "wallet_kyc", params: {} },
            { type: "result", decision: "APPROVE" },
          ],
        },
      ],
    };

    templates.push({
      name: "Low Risk OR KYC",
      description:
        "Approves if the wallet risk score is low OR the wallet is KYC verified. Demonstrates OR logic and branching.",
      policy: {
        schemaVersion: 1,
        graph: graph as any,
        compiled: compiled as any,
      },
      examples: [
        {
          label: "Approved (low risk)",
          tx: {
            amount: 75,
            wallet: {
              address: "0x4444444444444444444444444444444444444444",
              kyc: false,
              country: "BR",
              riskScore: 10,
            },
          },
        },
        {
          label: "Approved (KYC)",
          tx: {
            amount: 75,
            wallet: {
              address: subject,
              kyc: true,
              country: "BR",
              riskScore: 95,
            },
          },
        },
        {
          label: "Denied example",
          tx: {
            amount: 75,
            wallet: {
              address: "0x5555555555555555555555555555555555555555",
              kyc: false,
              country: "BR",
              riskScore: 95,
            },
          },
        },
      ],
    });
  }

  return templates;
}

export function findDemoTemplateByName(subjectAddress: string, name: string) {
  return getDemoTemplates(subjectAddress).find((t) => t.name === name) ?? null;
}
