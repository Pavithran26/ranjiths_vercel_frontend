"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionTabs } from "@/components/section-tabs";
import {
  createWorkLog,
  getEmployees,
  getLands,
  getVehicles,
  type Employee,
  type Land,
  type Vehicle
} from "@/lib/api";
import { clearStoredSession } from "@/lib/session";
import { useProtectedSession } from "@/lib/use-protected-session";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/worklogs", label: "Work Log List" },
  { href: "/worklogs/add", label: "Add Work Log" }
];

const initialForm = {
  workDate: "",
  landId: "",
  supervisorId: "",
  vehicleId: "",
  coconutCount: "0",
  bagCount: "0",
  workerIds: [] as string[],
  latitude: "",
  longitude: "",
  startTime: "",
  endTime: "",
  loadType: "",
  transportCost: "",
  location: "",
  notes: ""
};

export default function AddWorkLogPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [lands, setLands] = useState<Land[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState(initialForm);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    const loadData = async () => {
      try {
        const [landItems, employeeItems, vehicleItems] = await Promise.all([
          getLands(session.token),
          getEmployees(session.token),
          getVehicles(session.token)
        ]);
        setLands(landItems);
        setEmployees(employeeItems);
        setVehicles(vehicleItems);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load reference data");
      }
    };
    void loadData();
  }, [session]);

  useEffect(() => {
    if (typeof window !== "undefined" && lands.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryLandId = urlParams.get("landId");
      if (queryLandId && lands.some((l) => l.id === queryLandId)) {
        setForm((current) => ({ ...current, landId: queryLandId }));
      }
    }
  }, [lands]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleWorkerToggle = (employeeId: string) => {
    setForm((current) => ({
      ...current,
      workerIds: current.workerIds.includes(employeeId)
        ? current.workerIds.filter((id) => id !== employeeId)
        : [...current.workerIds, employeeId]
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setPageError("");

    try {
      await createWorkLog(session.token, {
        workDate: form.workDate,
        landId: form.landId,
        supervisorId: form.supervisorId || undefined,
        vehicleId: form.vehicleId || undefined,
        coconutCount: Number(form.coconutCount),
        bagCount: Number(form.bagCount),
        workerIds: form.workerIds,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
        loadType: form.loadType ? (form.loadType as "lease load" | "Direct Load") : null,
        transportCost: form.transportCost ? Number(form.transportCost) : null,
        location: form.location || null,
        notes: form.notes
      });
      router.push("/worklogs");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save work log");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="worklogs"
      heading="Add Work Log"
      description="Capture the daily harvesting job details."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Input data</p>
            <h3>Daily work log</h3>
          </div>
        </div>

        {pageError ? <p className="form-error">{pageError}</p> : null}

        <form className="data-form two-column-form" onSubmit={handleSubmit}>
          <label>
            <span>Work date</span>
            <input type="date" value={form.workDate} onChange={(event) => setForm((current) => ({ ...current, workDate: event.target.value }))} required />
          </label>
          <label>
            <span>Land</span>
            <select value={form.landId} onChange={(event) => setForm((current) => ({ ...current, landId: event.target.value }))} required>
              <option value="">Select land</option>
              {lands.map((land) => (
                <option key={land.id} value={land.id}>
                  {land.name} - {land.village}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Supervisor</span>
            <select value={form.supervisorId} onChange={(event) => setForm((current) => ({ ...current, supervisorId: event.target.value }))}>
              <option value="">Select supervisor</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Vehicle</span>
            <select value={form.vehicleId} onChange={(event) => setForm((current) => ({ ...current, vehicleId: event.target.value }))}>
              <option value="">Select vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNumber}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Coconut count</span>
            <input type="number" min="0" step="1" value={form.coconutCount} onChange={(event) => setForm((current) => ({ ...current, coconutCount: event.target.value }))} required />
          </label>
          <label>
            <span>Bag count</span>
            <input type="number" min="0" step="1" value={form.bagCount} onChange={(event) => setForm((current) => ({ ...current, bagCount: event.target.value }))} required />
          </label>
          <label>
            <span>Latitude</span>
            <input value={form.latitude} onChange={(event) => setForm((current) => ({ ...current, latitude: event.target.value }))} />
          </label>
          <label>
            <span>Longitude</span>
            <input value={form.longitude} onChange={(event) => setForm((current) => ({ ...current, longitude: event.target.value }))} />
          </label>
          <label>
            <span>Location</span>
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="E.g., North Field" />
          </label>
          <label>
            <span>Start Time</span>
            <input type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} />
          </label>
          <label>
            <span>End Time</span>
            <input type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} />
          </label>
          <label>
            <span>Load Type</span>
            <select value={form.loadType} onChange={(event) => setForm((current) => ({ ...current, loadType: event.target.value }))}>
              <option value="">Select load type</option>
              <option value="lease load">Lease Load</option>
              <option value="Direct Load">Direct Load</option>
            </select>
          </label>
          <label>
            <span>Transport Cost</span>
            <input type="number" min="0" step="0.01" value={form.transportCost} onChange={(event) => setForm((current) => ({ ...current, transportCost: event.target.value }))} />
          </label>
          <label className="form-span-two">
            <span>Notes</span>
            <textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>

          <div className="form-span-two worker-picker">
            <span className="field-label">Assign workers</span>
            <div className="worker-chip-grid">
              {employees.map((employee) => {
                const active = form.workerIds.includes(employee.id);
                return (
                  <button
                    key={employee.id}
                    className={active ? "worker-chip is-active" : "worker-chip"}
                    type="button"
                    onClick={() => handleWorkerToggle(employee.id)}
                  >
                    {employee.fullName}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="primary-button form-span-two" type="submit" disabled={saving}>
            {saving ? "Saving work log..." : "Save work log"}
          </button>
        </form>
      </article>
    </AppShell>
  );
}
