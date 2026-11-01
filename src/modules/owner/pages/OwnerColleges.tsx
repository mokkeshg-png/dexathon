import { useState, useEffect } from "react";
import { OwnerLayout } from "../layouts/OwnerLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Field";
import { fetchColleges, createCollege, updateCollegeStatus } from "@/services/saasService";
import type { College } from "@/types";
import { useToast } from "@/context/ToastContext";
import {
  Plus,
  Search,
  Mail,
  MapPin,
  Shield,
  Power,
} from "lucide-react";

export function OwnerColleges() {
  const toast = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [maxStudents, setMaxStudents] = useState(500);
  const [maxFaculty, setMaxFaculty] = useState(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadColleges();
  }, []);

  async function loadColleges() {
    try {
      const data = await fetchColleges();
      setColleges(data);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !email.trim()) {
      toast.error("Missing fields", "Please fill institution name, code and official email.");
      return;
    }

    setSaving(true);
    try {
      const created = await createCollege({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        domain: domain.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim() || undefined,
        status: "active",
        maxStudents: Number(maxStudents),
        maxFaculty: Number(maxFaculty),
      });

      setColleges([created, ...colleges]);
      setModalOpen(false);
      resetForm();
      toast.success("College Onboarded", `${created.name} is now an active tenant on SYNAPTRA.`);
    } catch (err: any) {
      toast.error("Error onboarding college", err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (col: College) => {
    const nextStatus = col.status === "active" ? "suspended" : "active";
    await updateCollegeStatus(col.id, nextStatus);
    setColleges(colleges.map((c) => (c.id === col.id ? { ...c, status: nextStatus } : c)));
    toast.info("Status Updated", `${col.name} status changed to ${nextStatus}.`);
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setDomain("");
    setCity("");
    setState("");
    setEmail("");
    setPhone("");
    setMaxStudents(500);
    setMaxFaculty(50);
  };

  const filtered = colleges.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#181B1F]">
              College & Tenant Management
            </h1>
            <p className="text-xs sm:text-sm text-[#5E646A] mt-1">
              Onboard university campuses, manage seat quotas, and supervise tenant domain isolation.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="primary" size="sm" className="shadow-clay text-xs">
            <Plus className="h-4 w-4 mr-1" /> Onboard New College
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by college name, code (e.g. IITD), or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#7B828A]" />
        </div>

        {/* Colleges Grid */}
        {loading ? (
          <div className="text-center py-12 text-sm text-[#7B828A]">Loading campus tenants...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((col) => (
            <Card key={col.id} className="p-5 border-[#ECE5D8] rounded-2xl bg-white shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-[#ECE5D8] pb-3">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#8C6000]">
                    {col.code} · ID: {col.id.slice(0, 8)}
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#181B1F] mt-0.5">{col.name}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-[#7B828A] mt-1">
                    <MapPin className="h-3 w-3" /> {col.city || "Campus"}, {col.state || "India"}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    col.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {col.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#FAF7EE] p-2.5 rounded-xl border border-[#ECE5D8]">
                  <span className="text-[10px] text-[#7B828A] uppercase font-mono">Student Quota</span>
                  <div className="font-bold text-[#181B1F] text-sm mt-0.5">{col.maxStudents} Seats</div>
                </div>
                <div className="bg-[#FAF7EE] p-2.5 rounded-xl border border-[#ECE5D8]">
                  <span className="text-[10px] text-[#7B828A] uppercase font-mono">Faculty Quota</span>
                  <div className="font-bold text-[#181B1F] text-sm mt-0.5">{col.maxFaculty} Seats</div>
                </div>
              </div>

              <div className="text-[11px] text-[#52575C] space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#7B828A]" />
                  <span>{col.contactEmail}</span>
                </div>
                {col.domain && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#7B828A]" />
                    <span>Domain Match: <strong>@{col.domain}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#ECE5D8]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(col)}
                  className={`text-xs ${col.status === "active" ? "text-amber-700 hover:bg-amber-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                >
                  <Power className="h-3.5 w-3.5 mr-1" />
                  {col.status === "active" ? "Suspend Tenant" : "Activate Tenant"}
                </Button>
                <span className="text-[11px] font-mono text-[#7B828A]">Isolated RLS</span>
              </div>
            </Card>
          ))}
        </div>
        )}

        {/* Create College Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Onboard New College Instance">
          <form onSubmit={handleCreateCollege} className="space-y-4">
            <Field label="College / University Name" hint="Full institutional name">
              <Input
                required
                placeholder="e.g. Indian Institute of Technology, Bombay"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="College Code" hint="Unique 3-6 letter abbreviation">
                <Input
                  required
                  placeholder="e.g. IITB"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>

              <Field label="Email Domain" hint="For automated student verification">
                <Input
                  placeholder="e.g. iitb.ac.in"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <Input placeholder="Mumbai" value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field label="State">
                <Input placeholder="Maharashtra" value={state} onChange={(e) => setState(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Email">
                <Input
                  type="email"
                  required
                  placeholder="dean.academics@iitb.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Contact Phone">
                <Input placeholder="+91 ..." value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Initial Student Capacity">
                <Input
                  type="number"
                  min={10}
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(Number(e.target.value))}
                />
              </Field>
              <Field label="Initial Faculty Capacity">
                <Input
                  type="number"
                  min={1}
                  value={maxFaculty}
                  onChange={(e) => setMaxFaculty(Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE5D8]">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving} className="shadow-clay">
                Confirm Onboarding
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </OwnerLayout>
  );
}
