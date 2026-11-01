import { useState } from "react";
import { OwnerLayout } from "../layouts/OwnerLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/context/ToastContext";
import {
  Shield,
  Sliders,
  Save,
} from "lucide-react";

export function OwnerSettings() {
  const toast = useToast();
  const [maintenance, setMaintenance] = useState(false);
  const [graceDays, setGraceDays] = useState(14);
  const [allowPublicSignup, setAllowPublicSignup] = useState(true);
  const [gatewayMode, setGatewayMode] = useState<"test" | "live">("test");
  const [defaultStudentQuota, setDefaultStudentQuota] = useState(500);
  const [defaultFacultyQuota, setDefaultFacultyQuota] = useState(50);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings Saved", "Platform operational configuration updated successfully.");
    }, 500);
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#181B1F]">
            Platform Governance & Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
            Global operational parameters, subscription lifecycle defaults, and security configurations.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <Card className="p-6 border-[#ECE5D8] rounded-2xl bg-white shadow-xs space-y-4">
            <h2 className="font-serif text-base font-bold text-[#181B1F] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#8C6000]" /> Subscription & Lifecycle Defaults
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Grace Period (Days)" hint="Days allowed after expiry before service restriction">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={graceDays}
                  onChange={(e) => setGraceDays(Number(e.target.value))}
                />
              </Field>

              <Field label="Payment Gateway Mode" hint="Razorpay execution environment">
                <Select
                  value={gatewayMode}
                  onChange={(e) => setGatewayMode(e.target.value as "test" | "live")}
                >
                  <option value="test">Sandbox / Test Mode (Safe demo)</option>
                  <option value="live">Live Production (Requires verified merchant)</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Field label="Default New College Student Quota">
                <Input
                  type="number"
                  min={10}
                  value={defaultStudentQuota}
                  onChange={(e) => setDefaultStudentQuota(Number(e.target.value))}
                />
              </Field>

              <Field label="Default New College Faculty Quota">
                <Input
                  type="number"
                  min={1}
                  value={defaultFacultyQuota}
                  onChange={(e) => setDefaultFacultyQuota(Number(e.target.value))}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6 border-[#ECE5D8] rounded-2xl bg-white shadow-xs space-y-4">
            <h2 className="font-serif text-base font-bold text-[#181B1F] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#8C6000]" /> Security & Public Access
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowPublicSignup}
                  onChange={(e) => setAllowPublicSignup(e.target.checked)}
                  className="mt-1 rounded border-[#ECE5D8] text-[#8C6000] focus:ring-[#FFC812]"
                />
                <div>
                  <span className="text-xs font-bold text-[#181B1F] block">
                    Allow Public College Onboarding Inquiries
                  </span>
                  <span className="text-[11px] text-[#5E646A]">
                    When checked, external institutions can submit an inquiry request from the landing portal.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenance}
                  onChange={(e) => setMaintenance(e.target.checked)}
                  className="mt-1 rounded border-[#ECE5D8] text-red-600 focus:ring-red-400"
                />
                <div>
                  <span className="text-xs font-bold text-red-700 block">
                    Emergency Maintenance Mode
                  </span>
                  <span className="text-[11px] text-[#5E646A]">
                    Restricts non-owner student and faculty access with a maintenance banner during major database updates.
                  </span>
                </div>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="submit" variant="primary" loading={saving} className="shadow-clay text-xs">
              <Save className="h-4 w-4 mr-1.5" /> Save Platform Configuration
            </Button>
          </div>
        </form>
      </div>
    </OwnerLayout>
  );
}
