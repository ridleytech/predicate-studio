import TooltipUI from "@/components/ui/Tooltip";

export default function SettingsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold">Settings</h1>
      <TooltipUI
        content="Demo data can be created via the seed script in web/scripts/seed-demo.mjs. This page is reserved for future runtime configuration."
        side="top"
      >
        <p className="text-sm text-slate-400">Coming later.</p>
      </TooltipUI>
    </div>
  );
}
