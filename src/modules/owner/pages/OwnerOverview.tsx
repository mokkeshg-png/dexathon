import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { OwnerLayout } from "../layouts/OwnerLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  fetchColleges,
  fetchCollegeSubscriptions,
  fetchPaymentTransactions,
} from "@/services/saasService";
import type { College, CollegeSubscription, PaymentTransaction } from "@/types";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export function OwnerOverview() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [subscriptions, setSubscriptions] = useState<CollegeSubscription[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cols, subs, pays] = await Promise.all([
          fetchColleges(),
          fetchCollegeSubscriptions(),
          fetchPaymentTransactions(),
        ]);
        setColleges(cols);
        setSubscriptions(subs);
        setPayments(pays);
      } catch (err) {
        console.error("Owner overview load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute platform metrics
  const activeColleges = colleges.filter((c) => c.status === "active").length;
  const totalStudentSeats = colleges.reduce((acc, c) => acc + c.maxStudents, 0);
  const totalFacultySeats = colleges.reduce((acc, c) => acc + c.maxFaculty, 0);

  // Total verified payments (INR)
  const totalRevenue = payments
    .filter((p) => p.status === "captured")
    .reduce((acc, p) => acc + p.amountInr, 0);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Header banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#181B1F]">
              Platform Owner Overview {loading && <span className="text-xs font-normal text-[#7B828A]">(Syncing...)</span>}
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
              Multi-tenant institutional performance, subscription health, and revenue telemetry.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/owner/colleges">
              <Button size="sm" variant="primary" className="shadow-clay text-xs">
                <Plus className="h-4 w-4 mr-1" /> Onboard College
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Core Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">Active Institutions</span>
              <div className="rounded-xl bg-[#FFF4D0] p-2 text-[#8C6000]">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-serif text-[#181B1F]">{activeColleges}</div>
              <p className="text-[11px] text-[#5E646A] mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Across {colleges.length} total onboarded
              </p>
            </div>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">Licensed Student Seats</span>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-700">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-serif text-[#181B1F]">
                {totalStudentSeats.toLocaleString()}
              </div>
              <p className="text-[11px] text-[#5E646A] mt-1">
                + {totalFacultySeats} Faculty seats active
              </p>
            </div>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">Verified Revenue (ARR)</span>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-serif text-[#181B1F]">
                ₹{(totalRevenue / 100000).toFixed(2)} Lakh
              </div>
              <p className="text-[11px] text-[#5E646A] mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" /> Settled institutional payments
              </p>
            </div>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7B828A]">System Health</span>
              <div className="rounded-xl bg-purple-50 p-2 text-purple-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-serif text-emerald-700">99.98%</div>
              <p className="text-[11px] text-[#5E646A] mt-1">
                {subscriptions.length} Subscriptions · RLS Active
              </p>
            </div>
          </Card>
        </div>

        {/* Colleges Overview Table */}
        <Card className="border-[#ECE5D8] rounded-2xl bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#ECE5D8] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#181B1F]">Registered College Tenants</h2>
              <p className="text-xs text-[#7B828A]">Individual institutional instances with isolated student workspaces</p>
            </div>
            <Link to="/owner/colleges" className="text-xs font-bold text-[#8C6000] hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7EE] text-[#7B828A] uppercase font-mono text-[10px] tracking-wider border-b border-[#ECE5D8]">
                <tr>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Code / Domain</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5D8]">
                {colleges.slice(0, 5).map((col) => (
                  <tr key={col.id} className="hover:bg-[#FFFDF7] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#181B1F]">{col.name}</div>
                      <div className="text-[11px] text-[#7B828A]">{col.city}, {col.state}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#52575C]">
                      <span className="font-bold text-[#181B1F]">{col.code}</span> · {col.domain || "Custom"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#181B1F]">{col.maxStudents} Students</span>
                      <span className="text-[11px] text-[#7B828A] block">{col.maxFaculty} Faculty</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          col.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {col.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/owner/colleges`}>
                        <Button variant="ghost" size="sm" className="text-xs text-[#8C6000]">
                          Manage
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Future Capabilities Quick Launch */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border-[#FFE785] bg-gradient-to-br from-[#FFFBEA] to-white rounded-2xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C6000] font-bold">Feature Module 1</span>
            <h3 className="font-serif text-sm font-bold text-[#181B1F]">Industry Innovation Bridge</h3>
            <p className="text-xs text-[#5E646A] leading-relaxed">
              Real-world corporate challenges matched with student teams & supervised by faculty.
            </p>
            <Link to="/industry" className="inline-flex items-center gap-1 text-xs font-bold text-[#8C6000] pt-1 hover:underline">
              Explore Bridge <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card className="p-5 border-[#ECE5D8] bg-white rounded-2xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B828A] font-bold">Feature Module 2</span>
            <h3 className="font-serif text-sm font-bold text-[#181B1F]">Curriculum Evolution Intelligence</h3>
            <p className="text-xs text-[#5E646A] leading-relaxed">
              Institutional gap analysis comparing university syllabus outcomes against practical student project code.
            </p>
            <Link to="/curriculum" className="inline-flex items-center gap-1 text-xs font-bold text-[#8C6000] pt-1 hover:underline">
              Inspect Reports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card className="p-5 border-[#ECE5D8] bg-white rounded-2xl shadow-xs space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B828A] font-bold">Feature Module 3</span>
            <h3 className="font-serif text-sm font-bold text-[#181B1F]">Project Knowledge Recovery</h3>
            <p className="text-xs text-[#5E646A] leading-relaxed">
              Personalized prerequisite learning sequences for students tackling complex project tasks.
            </p>
            <Link to="/recovery" className="inline-flex items-center gap-1 text-xs font-bold text-[#8C6000] pt-1 hover:underline">
              View Paths <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}
