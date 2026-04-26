"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import { getVehicles, deleteVehicle, type Vehicle } from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { ListControls } from "../../components/list-controls";
import { useListFilters } from "../../lib/use-list-filters";
import { useProtectedSession } from "../../lib/use-protected-session";
import { ConfirmModal } from "../../components/confirm-modal";
import { DataTable, type ColumnDef } from "../../components/data-table";
import { FaEdit, FaTrash } from "react-icons/fa";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vehicles", label: "Vehicle List" },
  { href: "/vehicles/add", label: "Add Vehicle" }
];



export default function VehiclesPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const { pageSize, startDate, endDate, setPageSize, setStartDate, setEndDate, appliedParams, handleApply, handleClear } = useListFilters();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadVehicles = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (appliedParams.pageSize === "all") {
          params.page_size = 10000;
        } else {
          params.page_size = appliedParams.pageSize;
        }
        if (appliedParams.startDate) params.created_at__gte = appliedParams.startDate;
        if (appliedParams.endDate) params.created_at__lte = appliedParams.endDate;

        setVehicles(await getVehicles(session.token, params));
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load vehicles");
      }
    };

    void loadVehicles();
  }, [session, appliedParams]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const confirmDelete = async () => {
    if (!session || !vehicleToDelete) return;

    setDeletingId(vehicleToDelete.id);
    setPageError("");

    try {
      await deleteVehicle(session.token, vehicleToDelete.id);
      setVehicles((current) => current.filter((item) => item.id !== vehicleToDelete.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete vehicle");
    } finally {
      setDeletingId("");
      setVehicleToDelete(null);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="vehicles"
      heading="Vehicle List"
      description="Maintain transport vehicles, capacity, and driver details for harvest movement."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <ConfirmModal
        isOpen={!!vehicleToDelete}
        title="Delete Vehicle"
        message={`Are you sure you want to delete vehicle ${vehicleToDelete?.registrationNumber}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setVehicleToDelete(null)}
      />
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



        <div style={{ marginTop: "2rem" }}>
          <ListControls
            pageSize={pageSize}
            startDate={startDate}
            endDate={endDate}
            onPageSizeChange={setPageSize}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onFilterApply={handleApply}
            onFilterClear={handleClear}
          />
        </div>

        <DataTable
          columns={[
            {
              header: "Vehicle",
              render: (vehicle) => (
                <>
                  <strong>{vehicle.registrationNumber}</strong>
                  <span>{vehicle.notes || "Transport master record"}</span>
                </>
              )
            },
            { header: "Type", accessor: "vehicleType" },
            {
              header: "Driver",
              render: (vehicle) => (
                <>
                  <strong>{vehicle.driverName || "Not assigned"}</strong>
                  <span>{vehicle.driverPhone}</span>
                </>
              )
            },
            { header: "Capacity", accessor: "capacity" },
            {
              header: "Actions",
              render: (vehicle) => (
                <div className="table-actions">
                  <button className="secondary-button table-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
                    <FaEdit size={16} />
                  </button>
                  <button
                    className="danger-button table-button"
                    type="button"
                    disabled={deletingId === vehicle.id}
                    onClick={() => setVehicleToDelete(vehicle)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    {deletingId === vehicle.id ? "..." : <FaTrash size={16} />}
                  </button>
                </div>
              )
            }
          ]}
          data={vehicles}
          keyExtractor={(item) => item.id}
          emptyState={
            <div className="empty-state-stack">
              <EmptyState
                title="No vehicles registered yet"
                description="Add the first transport vehicle so work logs and dispatch records can start linking to it."
              />
              <Link className="secondary-button" href="/vehicles/add">
                Go to add vehicle
              </Link>
            </div>
          }
        />
      </article>
    </AppShell>
  );
}
