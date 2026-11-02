import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  fetchSubscriptionPlans,
  fetchCollegeSubscription,
  fetchCollegePayments,
  createPaymentOrder,
  fetchCollegeById,
} from "@/services/saasService";
import { Button } from "@/components/ui/Button";
import { Card, Badge } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { SubscriptionPlan, CollegeSubscription, PaymentTransaction, College } from "@/types";
import {
  CheckCircle2,
  Sparkles,
  Shield,
  CreditCard,
  Clock,
  AlertTriangle as _AlertTriangle,
  ArrowLeft,
  Building2,
  Loader2,
  RefreshCcw,
  FileText,
  Info,
} from "lucide-react";

const BILLING_CYCLE_DISCOUNT = 17; // ~17% discount for annual billing

export function Subscription() {
  const { user, isAdmin, isCollegeAdmin, collegeId } = useAuth();
  const toast = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<CollegeSubscription | null>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveCollegeId = collegeId || "";

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, effectiveCollegeId]);

  async function load() {
    setLoading(true);
    try {
      const [ps, col] = await Promise.all([
        fetchSubscriptionPlans(),
        effectiveCollegeId ? fetchCollegeById(effectiveCollegeId) : Promise.resolve(null),
      ]);
      setPlans(ps);

      // If admin has no college_id yet, find their college by admin_id
      let resolvedCollege = col;
      let resolvedCollegeId = effectiveCollegeId;
      if (!resolvedCollege && user) {
        const { fetchColleges } = await import("@/services/saasService");
        const all = await fetchColleges();
        resolvedCollege = all.find((c) => c.adminId === user.id) || all[0] || null;
        resolvedCollegeId = resolvedCollege?.id || "";
      }
      setCollege(resolvedCollege);

      if (resolvedCollegeId) {
        const [sub, txns] = await Promise.all([
          fetchCollegeSubscription(resolvedCollegeId),
          fetchCollegePayments(resolvedCollegeId),
        ]);
        setCurrentSub(sub);
        setPayments(txns);
      }
    } catch (err: any) {
      console.error("Subscription load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const getPrice = (plan: SubscriptionPlan) =>
    billingCycle === "annual" ? plan.annualPriceInr : plan.monthlyPriceInr;

  const formatINR = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!isAdmin && !isCollegeAdmin) {
      toast.error("Access Denied", "Only College Administrators can manage subscriptions.");
      return;
    }
    if (!college?.id) {
      toast.error("No Institution", "Your account is not linked to a college. Contact the Platform Owner.");
      return;
    }
    setSelectedPlan(plan);
    setConfirmModalOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedPlan || !college?.id) return;
    setSubmitting(true);
    try {
      const amount = getPrice(selectedPlan);
      const txn = await createPaymentOrder({
        collegeId: college.id,
        planId: selectedPlan.id,
        billingCycle,
        amountInr: amount,
      });

      toast.success(
        "Subscription Request Submitted",
        `Order ${txn.orderId} created. The Platform Owner will review and activate your subscription. You will be notified once confirmed.`
      );
      setConfirmModalOpen(false);
      setSelectedPlan(null);
      await load();
    } catch (err: any) {
      toast.error("Request Failed", err?.message || "Could not submit subscription request.");
    } finally {
      setSubmitting(false);
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan) =>
    currentSub?.planId === plan.id && currentSub?.status === "active";

  const hasPendingPayment = payments.some((p) => p.status === "pending");

  if (!user) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-10 w-10 text-ink-300" />
        <h2 className="font-serif text-2xl font-bold">Sign In Required</h2>
        <Link to="/login"><Button>Sign In</Button></Link>
      </div>
    );
  }

  return (
    <div className="clay-page space-y-8">
      {/* Header */}
      <div className="clay-welcome-banner clay-neural-bg p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link to="/admin" className="text-xs font-bold text-[#8C6000] hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Console
            </Link>
            <span className="text-[#8C8372]">•</span>
            <span className="clay-badge clay-badge-gold text-[10px]">Subscription Management</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#181B1F]">
            Campus Subscription Plans
          </h1>
          <p className="text-xs sm:text-sm text-[#5E646A] max-w-2xl">
            Select the plan that fits your institution's size and research requirements. Subscriptions are activated by the Platform Owner after payment verification.
          </p>
        </div>
        {college && (
          <div className="clay-card-cream p-4 rounded-2xl border border-[#FFE785] shrink-0 text-center">
            <Building2 className="h-6 w-6 text-[#8C6000] mx-auto mb-1" />
            <p className="font-serif font-bold text-sm text-ink">{college.name}</p>
            <p className="text-[11px] text-ink-500">{college.code}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-navy" />
        </div>
      ) : (
        <>
          {/* Current Subscription Banner */}
          {currentSub && currentSub.status === "active" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-serif font-bold text-ink">
                    Active: <span className="text-emerald-800">{currentSub.plan?.name || "Current Plan"}</span>
                  </p>
                  <p className="text-xs text-emerald-700">
                    {currentSub.studentSeatsPurchased} student seats · {currentSub.facultySeatsPurchased} faculty seats ·{" "}
                    <span className="font-semibold capitalize">{currentSub.billingCycle} billing</span>
                  </p>
                  {currentSub.currentPeriodEnd && (
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      Renews {new Date(currentSub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={load}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>
          )}

          {/* Pending Payment Notice */}
          {hasPendingPayment && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-xs text-amber-900">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Payment Pending Owner Approval</p>
                <p className="mt-0.5 leading-relaxed">
                  Your subscription request has been submitted. The Platform Owner will review and activate your plan. This typically takes 1–2 business days. You will receive a notification once activated.
                </p>
              </div>
            </div>
          )}

          {/* No subscription + no pending = prompt */}
          {!currentSub && !hasPendingPayment && !isAdmin && !isCollegeAdmin && (
            <div className="rounded-2xl border border-[#ECE5D8] bg-white p-5 flex items-start gap-3 text-xs text-ink-600">
              <Info className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
              <p>Subscription management is available to College Administrators only. Contact your campus admin to manage the institution's plan.</p>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${billingCycle === "monthly" ? "text-ink" : "text-ink-400"}`}>Monthly</span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                billingCycle === "annual" ? "bg-[#FFC812]" : "bg-ink-200"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  billingCycle === "annual" ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm font-semibold ${billingCycle === "annual" ? "text-ink" : "text-ink-400"}`}>
              Annual
              <span className="ml-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                Save {BILLING_CYCLE_DISCOUNT}%
              </span>
            </span>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => {
              const isCurrent = isCurrentPlan(plan);
              const isPopular = idx === 1;
              const price = getPrice(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl border p-6 space-y-5 transition-all ${
                    isCurrent
                      ? "border-emerald-300 bg-emerald-50/40 shadow-sm"
                      : isPopular
                      ? "border-[#FFC812] bg-white shadow-[0_8px_32px_rgba(255,200,18,0.18)]"
                      : "border-[#ECE5D8] bg-white shadow-sm"
                  }`}
                >
                  {isPopular && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFC812] px-3 py-1 text-[10px] font-extrabold text-[#181B1F] border border-[#E6B30E] shadow-sm">
                        <Sparkles className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-extrabold text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3" /> Current Plan
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-serif text-xl font-bold text-ink">{plan.name}</h3>
                    <p className="text-xs text-ink-500 leading-relaxed">{plan.description}</p>
                  </div>

                  <div>
                    <p className="font-serif text-4xl font-extrabold text-ink">
                      {formatINR(price)}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      per {billingCycle === "annual" ? "year" : "month"} · billed {billingCycle}
                    </p>
                    {billingCycle === "annual" && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        Saves {formatINR(plan.monthlyPriceInr * 12 - plan.annualPriceInr)} vs monthly
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-[#ECE5D8] pt-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[#FAF7EE] p-2.5 text-center border border-[#ECE5D8]">
                        <p className="font-extrabold text-ink text-base">{plan.studentSeatLimit.toLocaleString()}</p>
                        <p className="text-ink-500 text-[10px]">Student Seats</p>
                      </div>
                      <div className="rounded-xl bg-[#FAF7EE] p-2.5 text-center border border-[#ECE5D8]">
                        <p className="font-extrabold text-ink text-base">{plan.facultySeatLimit}</p>
                        <p className="text-ink-500 text-[10px]">Faculty Seats</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5 pt-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-ink-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    variant={isPopular && !isCurrent ? "primary" : "outline"}
                    disabled={isCurrent || hasPendingPayment || (!isAdmin && !isCollegeAdmin)}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent
                      ? "Current Plan"
                      : hasPendingPayment
                      ? "Request Pending"
                      : !isAdmin && !isCollegeAdmin
                      ? "Admin Only"
                      : `Request ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Payment Method Notice */}
          <div className="rounded-2xl border border-[#ECE5D8] bg-white p-5 flex items-start gap-3 text-xs text-ink-600">
            <CreditCard className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-ink">How Subscription Activation Works</p>
              <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                <li>Select a plan and submit a subscription request.</li>
                <li>An order record is created in the SYNAPTRA platform database for the Platform Owner to review.</li>
                <li>The Platform Owner confirms payment via bank transfer, UPI, or institutional invoice and activates the plan.</li>
                <li>Your institution's student and faculty seat limits are immediately updated upon activation.</li>
                <li>You receive a confirmation notification once your subscription is active.</li>
              </ol>
              <p className="text-ink-400 pt-1">
                For enterprise pricing, custom seat allocation, or expedited activation, contact{" "}
                <a href="mailto:sales@synaptra.in" className="text-navy hover:underline">sales@synaptra.in</a>.
              </p>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-ink">Payment & Order History</h3>
                <Badge tone="slate">{payments.length} record{payments.length !== 1 ? "s" : ""}</Badge>
              </div>
              <div className="overflow-hidden rounded-xl border border-[#ECE5D8]">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF7EE] text-ink-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Amount</th>
                      <th className="px-4 py-3 text-left">Method</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE5D8]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FFFDF8]">
                        <td className="px-4 py-3 font-mono text-[11px] text-ink">{p.orderId}</td>
                        <td className="px-4 py-3 font-semibold text-ink">{formatINR(p.amountInr)}</td>
                        <td className="px-4 py-3 capitalize text-ink-500">{p.method}</td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={
                              p.status === "captured"
                                ? "green"
                                : p.status === "pending"
                                ? "amber"
                                : p.status === "failed"
                                ? "red"
                                : "slate"
                            }
                          >
                            {p.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-400">
                          {new Date(p.createdAt).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        open={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setSelectedPlan(null); }}
        title="Confirm Subscription Request"
      >
        {selectedPlan && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#FFE785] bg-[#FFFBEA] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-ink">{selectedPlan.name}</h3>
                <Badge tone={billingCycle === "annual" ? "green" : "amber"}>
                  {billingCycle.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-center">
                <div className="rounded-xl bg-white p-2.5 border border-[#ECE5D8]">
                  <p className="font-extrabold text-ink text-sm">{formatINR(getPrice(selectedPlan))}</p>
                  <p className="text-ink-400 text-[10px]">Amount</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-[#ECE5D8]">
                  <p className="font-extrabold text-ink text-sm">{selectedPlan.studentSeatLimit}</p>
                  <p className="text-ink-400 text-[10px]">Students</p>
                </div>
                <div className="rounded-xl bg-white p-2.5 border border-[#ECE5D8]">
                  <p className="font-extrabold text-ink text-sm">{selectedPlan.facultySeatLimit}</p>
                  <p className="text-ink-400 text-[10px]">Faculty</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                This submits a subscription request. Your plan will be activated after the Platform Owner verifies payment. No charges are made automatically.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setConfirmModalOpen(false); setSelectedPlan(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSubmitRequest} disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting...</>
                ) : (
                  <><FileText className="h-4 w-4 mr-1" /> Submit Request</>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
