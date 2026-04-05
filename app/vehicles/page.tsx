"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import { createVehicle, getVehicles, type Vehicle } from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useProtectedSession } from "../../lib/use-protected-session";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicle master" }
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

export default function VehiclesPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState(initialVehicleForm);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadVehicles = async () => {
      try {
        setVehicles(await getVehicles(session.token));
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load vehicles");
      }
    };

    void loadVehicles();
  }, [session]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSaving(true);
    setPageError("");

    try {
      const vehicle = await createVehicle(session.token, {
        registrationNumber: form.registrationNumber,
        vehicleType: form.vehicleType,
        capacity: Number(form.capacity),
        driverName: form.driverName,
        driverPhone: form.driverPhone,
        isActive: form.isActive,
        notes: form.notes
      });
      setVehicles((current) => [vehicle, ...current]);
      setForm(initialVehicleForm);
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
      heading="Vehicle Master"
      description="Maintain transport vehicles, capacity, and driver details for harvest movement."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Transport registry</p>
            <h3>Vehicle desk</h3>
            <p className="panel-description">
              Save vehicle master data once so work logs and transport expenses can reuse it cleanly.
            </p>
          </div>
        </div>

        <div className="insight-strip">
          <div className="insight-card">
            <span>Vehicles saved</span>
            <strong>{vehicles.length}</strong>
            <p>Total vehicles in the transport master</p>
          </div>
          <div className="insight-card">
            <span>Total capacity</span>
            <strong>{vehicles.reduce((sum, item) => sum + item.capacity, 0).toFixed(0)}</strong>
            <p>Combined carrying capacity from saved vehicles</p>
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

        {vehicles.length === 0 ? (
          <div className="empty-state-stack">
            <EmptyState
              title="No vehicles registered yet"
              description="Add the first transport vehicle so work logs and dispatch records can start linking to it."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Driver</th>
                  <th>Capacity</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      <strong>{vehicle.registrationNumber}</strong>
                      <span>{vehicle.notes || "Transport master record"}</span>
                    </td>
                    <td>{vehicle.vehicleType}</td>
                    <td>
                      <strong>{vehicle.driverName || "Not assigned"}</strong>
                      <span>{vehicle.driverPhone}</span>
                    </td>
                    <td>{vehicle.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </AppShell>
  );
}
