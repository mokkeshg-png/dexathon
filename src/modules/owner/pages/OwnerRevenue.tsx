import { useState, useEffect } from "react";
import { OwnerLayout } from "../layouts/OwnerLayout";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchPaymentTransactions, fetchColleges } from "@/services/saasService";
import type { PaymentTransaction, College } from "@/types";
import {
  Download,
  CheckCircle2,
  Receipt,
} from "lucide-react";

export function OwnerRevenue() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pays, cols] = await Promise.all([
          fetchPaymentTransactions(),
          fetchColleges(),
        ]);
        setPayments(pays);
        setColleges(cols);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCaptured = payments
    .filter((p) => p.status === "captured")
    .reduce((acc, p) => acc + p.amountInr, 0);

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#181B1F]">
            Payment & Revenue Ledger {loading && <span className="text-xs font-normal text-[#7B828A]">(Loading...)</span>}
          </h1>
          <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
            Server-verified transaction records, payment gateway order audits, and GST-compliant institutional invoices.
          </p>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <span className="text-xs font-semibold text-[#7B828A]">Total Settled Revenue</span>
            <div className="mt-2 text-2xl font-bold font-serif text-[#181B1F]">
              ₹{totalCaptured.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> 100% Verified via Webhook Signature
            </p>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <span className="text-xs font-semibold text-[#7B828A]">Payment Gateway Integration</span>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-bold font-serif text-[#181B1F]">Razorpay PG</span>
              <Badge tone="slate">Sandbox / Test Mode</Badge>
            </div>
            <p className="text-[11px] text-[#5E646A] mt-1">
              Supports UPI AutoPay, NetBanking & Corporate NEFT
            </p>
          </Card>

          <Card className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs">
            <span className="text-xs font-semibold text-[#7B828A]">Invoices Dispatched</span>
            <div className="mt-2 text-2xl font-bold font-serif text-[#181B1F]">
              {payments.filter((p) => p.invoiceNumber).length} Invoices
            </div>
            <p className="text-[11px] text-[#5E646A] mt-1">
              Archived for institutional accounting audit
            </p>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="border-[#ECE5D8] rounded-2xl bg-white shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#ECE5D8] flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#181B1F]">Institutional Transactions</h2>
              <p className="text-xs text-[#7B828A]">Idempotent transaction log with provider payment IDs</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Export Audit CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7EE] text-[#7B828A] uppercase font-mono text-[10px] tracking-wider border-b border-[#ECE5D8]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">College Tenant</th>
                  <th className="py-3 px-4">Order / Payment ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5D8]">
                {payments.map((p) => {
                  const college = colleges.find((c) => c.id === p.collegeId);
                  return (
                    <tr key={p.id} className="hover:bg-[#FFFDF7] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#181B1F]">
                        {p.invoiceNumber || "—"}
                        <span className="block text-[10px] font-normal text-[#7B828A]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#181B1F]">
                        {college?.name || p.collegeId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#52575C]">
                        <div>{p.orderId}</div>
                        <div className="text-[10px] text-[#7B828A]">{p.paymentId || "pending capture"}</div>
                      </td>
                      <td className="py-3.5 px-4 font-serif font-bold text-sm text-[#181B1F]">
                        ₹{p.amountInr.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-[#52575C]">
                        {p.method}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button variant="ghost" size="sm" className="text-xs text-[#8C6000]">
                          <Receipt className="h-3.5 w-3.5 mr-1" /> View PDF
                        </Button>
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
