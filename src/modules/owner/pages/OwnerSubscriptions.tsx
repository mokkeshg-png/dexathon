import { useState, useEffect } from "react";
import { OwnerLayout } from "../layouts/OwnerLayout";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchSubscriptionPlans, fetchCollegeSubscriptions, fetchColleges } from "@/services/saasService";
import type { SubscriptionPlan, CollegeSubscription, College } from "@/types";
import {
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export function OwnerSubscriptions() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<CollegeSubscription[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, s, c] = await Promise.all([
          fetchSubscriptionPlans(),
          fetchCollegeSubscriptions(),
          fetchColleges(),
        ]);
        setPlans(p);
        setSubscriptions(s);
        setColleges(c);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#181B1F]">
            Subscription & Plan Architecture {loading && <span className="text-xs font-normal text-[#7B828A]">(Loading...)</span>}
          </h1>
          <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
            Configure institutional pricing tiers, student seat allotments, and track active lifecycle renewals.
          </p>
        </div>

        {/* 3 Configurable Subscription Plans */}
        <div className="space-y-3">
          <h2 className="font-serif text-base font-bold text-[#181B1F]">Configurable Institutional Tiers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C6000]">
                      {plan.code} Tier
                    </span>
                    <Badge tone={plan.isActive ? "green" : "slate"}>
                      {plan.isActive ? "Active" : "Archived"}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#181B1F]">{plan.name}</h3>
                    <p className="text-xs text-[#5E646A] mt-1">{plan.description}</p>
                  </div>

                  <div className="border-t border-b border-[#ECE5D8] py-3 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="font-serif text-2xl font-black text-[#181B1F]">
                        ₹{plan.annualPriceInr.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#7B828A]">/ year</span>
                    </div>
                    <span className="text-[11px] text-[#7B828A] block">
                      or ₹{plan.monthlyPriceInr.toLocaleString()} billed monthly
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#181B1F]">
                      <span>Student Capacity:</span>
                      <span className="font-mono">{plan.studentSeatLimit} seats</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-[#181B1F]">
                      <span>Faculty Capacity:</span>
                      <span className="font-mono">{plan.facultySeatLimit} seats</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <span className="text-[10px] uppercase font-mono text-[#7B828A] font-bold">Included Capabilities</span>
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#52575C]">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#ECE5D8]">
                  <Button variant="outline" size="sm" className="w-full text-xs text-[#8C6000]">
                    Edit Plan Settings
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Active College Subscriptions List */}
        <Card className="border-[#ECE5D8] rounded-2xl bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#ECE5D8]">
            <h2 className="font-serif text-base font-bold text-[#181B1F]">Active Campus Subscriptions</h2>
            <p className="text-xs text-[#7B828A]">Verified institutional licences and seat quotas</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7EE] text-[#7B828A] uppercase font-mono text-[10px] tracking-wider border-b border-[#ECE5D8]">
                <tr>
                  <th className="py-3 px-4">Campus / College</th>
                  <th className="py-3 px-4">Tier / Cycle</th>
                  <th className="py-3 px-4">Seat Allocation</th>
                  <th className="py-3 px-4">Current Term</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5D8]">
                {subscriptions.map((sub) => {
                  const college = colleges.find((c) => c.id === sub.collegeId);
                  const plan = plans.find((p) => p.id === sub.planId);
                  return (
                    <tr key={sub.id} className="hover:bg-[#FFFDF7] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#181B1F]">
                        {college?.name || `College (${sub.collegeId.slice(0, 8)})`}
                        <span className="block text-[11px] font-normal text-[#7B828A]">{college?.code}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#181B1F]">{plan?.name || "Enterprise"}</span>
                        <span className="block text-[10px] uppercase font-mono text-[#7B828A]">{sub.billingCycle}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[#181B1F]">
                          {sub.studentSeatsPurchased + (sub.additionalStudentSeats || 0)} Students
                        </div>
                        <div className="text-[10px] text-[#7B828A]">
                          {sub.facultySeatsPurchased} Faculty
                          {sub.additionalStudentSeats > 0 && ` (+${sub.additionalStudentSeats} Add-on seats)`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[#52575C]">
                        <div>Renews: {new Date(sub.currentPeriodEnd).toLocaleDateString()}</div>
                        <span className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5">
                          <RefreshCw className="h-2.5 w-2.5" /> Auto-renew enabled
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </OwnerLayout>
  );
}
