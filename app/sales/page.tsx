"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import {
  getSalesEntries,
  deleteSalesEntry,
  type SalesEntry
} from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { ListControls } from "../../components/list-controls";
import { useListFilters } from "../../lib/use-list-filters";
import { useProtectedSession } from "../../lib/use-protected-session";
import { ConfirmModal } from "../../components/confirm-modal";
import { DataTable, type ColumnDef } from "../../components/data-table";
import { FaEdit, FaTrash } from "react-icons/fa";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sales", label: "Sales List" },
  { href: "/sales/add", label: "Add Sales Entry" }
];



export default function SalesPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const { pageSize, startDate, endDate, setPageSize, setStartDate, setEndDate, appliedParams, handleApply, handleClear } = useListFilters();
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [saleToDelete, setSaleToDelete] = useState<SalesEntry | null>(null);

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
        if (appliedParams.startDate) params.sale_date__gte = appliedParams.startDate;
        if (appliedParams.endDate) params.sale_date__lte = appliedParams.endDate;

        const [salesItems] = await Promise.all([
          getSalesEntries(session.token, params)
        ]);
        setSalesEntries(salesItems);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load sales");
      }
    };

    void loadData();
  }, [session, appliedParams]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const confirmDelete = async () => {
    if (!session || !saleToDelete) return;

    setDeletingId(saleToDelete.id);
    setPageError("");

    try {
      await deleteSalesEntry(session.token, saleToDelete.id);
      setSalesEntries((current) => current.filter((item) => item.id !== saleToDelete.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete sales entry");
    } finally {
      setDeletingId("");
      setSaleToDelete(null);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="sales"
      heading="Sales List"
      description="Capture buyer details, sale quantity, price, and transport cost so profit reporting stays accurate."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <ConfirmModal
        isOpen={!!saleToDelete}
        title="Delete Sales Entry"
        message={`Are you sure you want to delete the sale for ${saleToDelete?.buyerName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setSaleToDelete(null)}
      />
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Revenue desk</p>
            <h3>Buyer and sales ledger</h3>
            <p className="panel-description">
              Add the buyer once, then post each sale with quantity, rate, and transport cost.
            </p>
          </div>
        </div>

        <div className="insight-strip">
          <div className="insight-card">
            <span>Sales saved</span>
            <strong>{salesEntries.length}</strong>
            <p>Revenue entries recorded in the system</p>
          </div>
          <div className="insight-card">
            <span>Gross revenue</span>
            <strong>Rs {salesEntries.reduce((sum, item) => sum + item.grossAmount, 0).toFixed(0)}</strong>
            <p>Total gross amount from sales entries</p>
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
            { header: "Date", accessor: "saleDate" },
            {
              header: "Buyer",
              render: (entry) => (
                <>
                  <strong>{entry.buyerName}</strong>
                  <span>{entry.notes || "Sales ledger entry"}</span>
                </>
              )
            },
            {
              header: "Land",
              render: (entry) => entry.landName || "Not linked"
            },
            { header: "Quantity", accessor: "quantity" },
            {
              header: "Value",
              render: (entry) => (
                <>
                  <strong>Rs {entry.grossAmount.toFixed(0)}</strong>
                  <span>Transport Rs {entry.transportCost.toFixed(0)}</span>
                </>
              )
            },
            {
              header: "Actions",
              render: (entry) => (
                <div className="table-actions">
                  <button className="secondary-button table-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
                    <FaEdit size={16} />
                  </button>
                  <button
                    className="danger-button table-button"
                    type="button"
                    disabled={deletingId === entry.id}
                    onClick={() => setSaleToDelete(entry)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    {deletingId === entry.id ? "..." : <FaTrash size={16} />}
                  </button>
                </div>
              )
            }
          ]}
          data={salesEntries}
          keyExtractor={(item) => item.id}
          emptyState={
            <div className="empty-state-stack">
              <EmptyState
                title="No sales entries yet"
                description="Use the buyer and sales forms to begin tracking revenue and later profit."
              />
              <Link className="secondary-button" href="/sales/add">
                Go to add sales entry
              </Link>
            </div>
          }
        />
      </article>
    </AppShell>
  );
}
