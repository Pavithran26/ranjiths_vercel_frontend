"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import { ListControls } from "../../components/list-controls";
import {
  getLands,
  getLandOwners,
  deleteLand,
  type Land,
  type LandOwner
} from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useListFilters } from "../../lib/use-list-filters";
import { useProtectedSession } from "../../lib/use-protected-session";
import { ConfirmModal } from "../../components/confirm-modal";
import { DataTable, type ColumnDef } from "../../components/data-table";
import { FaEdit, FaTrash, FaBook } from "react-icons/fa";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lands", label: "Land List" },
  { href: "/lands/add", label: "Add Land" }
];



export default function LandsPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const { pageSize, startDate, endDate, setPageSize, setStartDate, setEndDate, appliedParams, handleApply, handleClear } = useListFilters();
  const [owners, setOwners] = useState<LandOwner[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [landToDelete, setLandToDelete] = useState<Land | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadData = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (appliedParams.pageSize === "all") {
          params.page_size = 10000;
        } else {
          params.page_size = appliedParams.pageSize;
        }
        if (appliedParams.startDate) params.lease_start_date__gte = appliedParams.startDate;
        if (appliedParams.endDate) params.lease_start_date__lte = appliedParams.endDate;

        const [ownerItems, landItems] = await Promise.all([
          getLandOwners(session.token),
          getLands(session.token, params)
        ]);
        setOwners(ownerItems);
        setLands(landItems);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load lands");
      }
    };

    void loadData();
  }, [session, appliedParams]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const confirmDelete = async () => {
    if (!session || !landToDelete) return;

    setDeletingId(landToDelete.id);
    setPageError("");

    try {
      await deleteLand(session.token, landToDelete.id);
      setLands((current) => current.filter((item) => item.id !== landToDelete.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete land");
    } finally {
      setDeletingId("");
      setLandToDelete(null);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="lands"
      heading="Land List"
      description="Register land owners, gudhagai lease details, acreage, and tree count in one master ledger."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <ConfirmModal
        isOpen={!!landToDelete}
        title="Delete Land"
        message={`Are you sure you want to delete ${landToDelete?.name}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setLandToDelete(null)}
      />
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Land and owner registry</p>
            <h3>Lease records</h3>
            <p className="panel-description">
              Capture the owner first, then register the land with lease amount and tree count so every harvest can be linked correctly.
            </p>
          </div>
        </div>

        <div className="insight-strip">
          <div className="insight-card">
            <span>Owners saved</span>
            <strong>{owners.length}</strong>
            <p>Land owners available for new lease records</p>
          </div>
          <div className="insight-card">
            <span>Lands saved</span>
            <strong>{lands.length}</strong>
            <p>Master lands ready for work logs and profit reports</p>
          </div>
          <div className="insight-card">
            <span>Total trees</span>
            <strong>{lands.reduce((sum, item) => sum + item.treeCount, 0)}</strong>
            <p>Combined tree count across registered lands</p>
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
              header: "Land",
              render: (land) => (
                <>
                  <strong>{land.name}</strong>
                  <span>{land.areaAcres.toFixed(2)} acres</span>
                </>
              )
            },
            { header: "Owner", accessor: "ownerName" },
            { header: "Village", accessor: "village" },
            {
              header: "Financials",
              render: (land) => (
                <>
                  <strong>Rs {land.leaseAmount.toFixed(0)} Total</strong>
                  <span style={{ color: land.balanceDue > 0 ? "var(--brand-error, #ef4444)" : "var(--brand-success, #10b981)" }}>
                    Rs {land.balanceDue.toFixed(0)} Due
                  </span>
                </>
              )
            },
            { header: "Tree count", accessor: "treeCount" },
            {
              header: "Actions",
              render: (land) => (
                <div className="table-actions">
                  <Link href={`/lands/${land.id}`} className="secondary-button table-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }} title="Payment Ledger">
                    <FaBook size={16} />
                  </Link>
                  <button className="secondary-button table-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
                    <FaEdit size={16} />
                  </button>
                  <button
                    className="danger-button table-button"
                    type="button"
                    disabled={deletingId === land.id}
                    onClick={() => setLandToDelete(land)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    {deletingId === land.id ? "..." : <FaTrash size={16} />}
                  </button>
                </div>
              )
            }
          ]}
          data={lands}
          keyExtractor={(item) => item.id}
          emptyState={
            <div className="empty-state-stack">
              <EmptyState
                title="No lands registered yet"
                description="Start with the owner and land forms to link work logs to the correct grove."
              />
              <Link className="secondary-button" href="/lands/add">
                Go to add land
              </Link>
            </div>
          }
        />
      </article>
    </AppShell>
  );
}
