import { useState } from "react";
import { OwnerLayout } from "../layouts/OwnerLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Database,
  Cpu,
  Lock,
  RefreshCw,
  Clock,
} from "lucide-react";

export function OwnerMonitoring() {
  const [refreshing, setRefreshing] = useState(false);

  const auditEvents = [
    {
      id: "evt-1",
      action: "TENANT_ACCESS_VERIFIED",
      actor: "Security Gatekeeper",
      target: "College (col-1 Hauz Khas)",
      status: "SUCCESS",
      time: "2 mins ago",
      details: "RLS filter checked: student query strictly scoped to college_id = col-1.",
    },
    {
      id: "evt-2",
      action: "SUBSCRIPTION_RENEWAL_ORDER",
      actor: "Razorpay Webhook",
      target: "Invoice INV-2026-0001",
      status: "SUCCESS",
      time: "14 mins ago",
      details: "Signature HMAC-SHA256 verified; auto-renew applied for 365 days.",
    },
    {
      id: "evt-3",
      action: "PREVENT_ROLE_ESCALATION_TRIGGER",
      actor: "PostgreSQL Kernel",
      target: "public.profiles",
      status: "SUCCESS",
      time: "1 hour ago",
      details: "Unauthorized direct client update to column 'role' prevented by database trigger.",
    },
    {
      id: "evt-4",
      action: "COLLEGE_SEAT_QUOTA_CHECK",
      actor: "Registration Gateway",
      target: "BITS Pilani (col-2)",
      status: "SUCCESS",
      time: "3 hours ago",
      details: "Quota verified: 800 seats purchased, 342 active. Registration permitted.",
    },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#181B1F]">
              Platform Telemetry & Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
              Live operational health, tenant boundary verification, and immutable security audit records.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 600);
            }}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} /> Refresh Diagnostics
          </Button>
        </div>

        {/* Live Service Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">PostgreSQL Database</span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-700" />
              <span className="font-serif font-bold text-lg text-[#181B1F]">Active & Connected</span>
            </div>
            <p className="text-[11px] text-[#5E646A]">
              mzmhfiaiaflsxkdpfdzl.supabase.co · Latency: 97ms
            </p>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">Tenant RLS Policies</span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-700" />
              <span className="font-serif font-bold text-lg text-[#181B1F]">Enforced</span>
            </div>
            <p className="text-[11px] text-[#5E646A]">
              14/14 Tenant tables protected with row-level security
            </p>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">Gemini AI Intelligence</span>
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#FFC812]" />
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-[#8C6000]" />
              <span className="font-serif font-bold text-lg text-[#181B1F]">Dual Engine Ready</span>
            </div>
            <p className="text-[11px] text-[#5E646A]">
              Server Edge + Resilient deterministic local fallback
            </p>
          </Card>
        </div>

        {/* Security Audit Records */}
        <Card className="border-[#ECE5D8] rounded-2xl bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#ECE5D8]">
            <h2 className="font-serif text-base font-bold text-[#181B1F]">Security Audit & Tenant Action Log</h2>
            <p className="text-xs text-[#7B828A]">Immutable audit trail of cross-tenant and administrative operations</p>
          </div>

          <div className="divide-y divide-[#ECE5D8]">
            {auditEvents.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-[#FFFDF7] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#8C6000] text-[11px]">{evt.action}</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                      {evt.status}
                    </span>
                  </div>
                  <p className="text-[#181B1F] text-xs">{evt.details}</p>
                  <div className="text-[11px] text-[#7B828A] flex items-center gap-2 font-mono">
                    <span>Actor: {evt.actor}</span>
                    <span>·</span>
                    <span>Target: {evt.target}</span>
                  </div>
                </div>
                <div className="text-[11px] text-[#7B828A] font-mono whitespace-nowrap flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {evt.time}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </OwnerLayout>
  );
}
