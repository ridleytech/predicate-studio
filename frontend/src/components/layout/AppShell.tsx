"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import TooltipUI from "@/components/ui/Tooltip";
import OnboardingModal, {
  useOnboarding,
} from "@/components/onboarding/OnboardingModal";

type Props = {
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/policy-builder", label: "Policy Builder" },
  { href: "/simulator", label: "Policy Simulator" },
  { href: "/audit", label: "Audit Explorer" },
  { href: "/settings", label: "Settings" },
];

const navHelp: Record<string, string> = {
  "/dashboard": "Metrics and charts for recent evaluations.",
  "/policy-builder": "Create and edit policies using a visual graph.",
  "/simulator":
    "Run a transaction against a policy, then generate auth / execute on-chain.",
  "/audit": "Browse evaluation history and replay traces.",
  "/settings": "Reserved for future runtime configuration.",
};

export default function AppShell({ children }: Props) {
  const pathname = usePathname();
  const onboarding = useOnboarding();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 px-4 py-4 md:block">
          <div className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Predicate
          </div>
          <div className="px-2 pb-3 text-sm font-semibold text-slate-100">
            Developer Studio
          </div>

          <nav className="mt-4 space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <TooltipUI
                  key={item.href}
                  content={navHelp[item.href] ?? ""}
                  side="top"
                >
                  <Link
                    href={item.href}
                    className={[
                      "block rounded-md px-3 py-2 text-sm",
                      active
                        ? "bg-slate-800 text-slate-50"
                        : "text-slate-300 hover:bg-slate-900 hover:text-slate-50",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </TooltipUI>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
            <div className="text-sm font-semibold text-slate-100">
              Predicate Developer Studio
            </div>
            <div className="flex items-center gap-3">
              <TooltipUI
                content="Opens a guided walkthrough of the main demo flow."
                side="top"
              >
                <span>
                  <Button
                    variant="secondary"
                    onClick={() => onboarding.setOpen(true)}
                    className="h-8 px-2 text-xs"
                  >
                    Getting Started
                  </Button>
                </span>
              </TooltipUI>
              <div className="text-xs text-slate-400">PoC</div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
        </div>
      </div>

      <OnboardingModal
        isOpen={onboarding.open}
        onClose={() => onboarding.setOpen(false)}
        onComplete={onboarding.markComplete}
      />
    </div>
  );
}
