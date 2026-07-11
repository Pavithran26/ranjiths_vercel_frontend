"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionTabs } from "@/components/section-tabs";
import { getVehicle, updateVehicle } from "@/lib/api";
import { clearStoredSession } from "@/lib/session";
import { useProtectedSession } from "@/lib/use-protected-session";

const initialVehicleForm = {
  registrationNumber: "",
  vehicleType: "",
  capacity: "0",
  driverName: "",
  driverPhone: "",
  isActive: true,
  notes: ""
};

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [form, setForm] = useState(initialVehicleForm);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  useEffect(() => {
    if (!session || !params.id) return;
    const loadVehicle = async () => {
      try {
        const vehicle = await getVehicle(session.token, params.id);
        setForm({
          registrationNumber: vehicle.registrationNumber,
          vehicleType: vehicle.vehicleType,
          capacity: String(vehicle.capacity),
          driverName: vehicle.driverName || "",
          driverPhone: vehicle.driverPhone || "",
          isActive: vehicle.isActive,
          notes: vehicle.notes || ""
        });
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load vehicle data");
      } finally {
        setLoadingVehicle(false);
      }
    };
    void loadVehicle();
  }, [params.id, session]);

  const tabs = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/vehicles", label: "Vehicle List" },
    { href: "/vehicles/add", label: "Add Vehicle" },
    { href: `/vehicles/${params.id}/edit`, label: "Edit Vehicle" }
  ];

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !params.id) return;
    setSaving(true);
    setPageError("");

    try {
      await updateVehicle(session.token, params.id, {
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
      setPageError(error instanceof Error ? error.message : "Unable to update vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session || loadingVehicle) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="vehicles"
      heading="Edit Vehicle"
      description="Update registered transport vehicle details."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Update details</p>
            <h3>Edit vehicle registration</h3>
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
          <label className="form-span-two" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} style={{ width: "auto" }} />
            <span>Is Active</span>
          </label>
          <button className="primary-button form-span-two" type="submit" disabled={saving}>
            {saving ? "Updating vehicle..." : "Update vehicle"}
          </button>
        </form>
      </article>
    </AppShell>
  );
}
