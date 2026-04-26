"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "../../../components/app-shell";
import { SectionTabs } from "../../../components/section-tabs";
import { createVehicle } from "../../../lib/api";
import { clearStoredSession } from "../../../lib/session";
import { useProtectedSession } from "../../../lib/use-protected-session";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicle List" },
  { href: "/vehicles/add", label: "Add Vehicle" }
];

const initialVehicleForm = {
  registrationNumber: "",
  vehicleType: "",
  capacity: "0",
  driverName: "",
  driverPhone: "",
  isActive: true,
  notes: ""
};

export default function AddVehiclePage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [form, setForm] = useState(initialVehicleForm);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setPageError("");

    try {
      await createVehicle(session.token, {
        registrationNumber: form.registrationNumber,
        vehicleType: form.vehicleType,
        capacity: Number(form.capacity),
        driverName: form.driverName,
        driverPhone: form.driverPhone,
        isActive: form.isActive,
        notes: form.notes
      });
      router.push("/vehicles");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="vehicles"
      heading="Add Vehicle"
      description="Register a new transport vehicle."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Input data</p>
            <h3>Register new vehicle</h3>
          </div>
        </div>

        {pageError ? <p className="form-error">{pageError}</p> : null}

        <form className="data-form two-column-form" onSubmit={handleSubmit}>
          <label>
            <span>Registration number</span>
            <input value={form.registrationNumber} onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))} required />
          </label>
          <label>
            <span>Vehicle type</span>
            <input value={form.vehicleType} onChange={(event) => setForm((current) => ({ ...current, vehicleType: event.target.value }))} required />
          </label>
          <label>
            <span>Capacity</span>
            <input type="number" min="0" step="0.01" value={form.capacity} onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} required />
          </label>
          <label>
            <span>Driver name</span>
            <input value={form.driverName} onChange={(event) => setForm((current) => ({ ...current, driverName: event.target.value }))} />
          </label>
          <label>
            <span>Driver phone</span>
            <input value={form.driverPhone} onChange={(event) => setForm((current) => ({ ...current, driverPhone: event.target.value }))} />
          </label>
          <label className="form-span-two">
            <span>Notes</span>
            <textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <button className="primary-button form-span-two" type="submit" disabled={saving}>
            {saving ? "Saving vehicle..." : "Save vehicle"}
          </button>
        </form>
      </article>
    </AppShell>
  );
}
