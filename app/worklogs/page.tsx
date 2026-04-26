"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import {
  getWorkLogs,
  deleteWorkLog,
  type WorkLog
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
  { href: "/worklogs", label: "Work Log List" },
  { href: "/worklogs/add", label: "Add Work Log" }
];



export default function WorkLogsPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const { pageSize, startDate, endDate, setPageSize, setStartDate, setEndDate, appliedParams, handleApply, handleClear } = useListFilters();
  const [worklogs, setWorklogs] = useState<WorkLog[]>([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [worklogToDelete, setWorklogToDelete] = useState<WorkLog | null>(null);

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
        if (appliedParams.startDate) params.work_date__gte = appliedParams.startDate;
        if (appliedParams.endDate) params.work_date__lte = appliedParams.endDate;

        const [worklogItems] = await Promise.all([
          getWorkLogs(session.token, params)
        ]);
        setWorklogs(worklogItems);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load work logs");
      }
    };

    void loadData();
  }, [session, appliedParams]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const confirmDelete = async () => {
    if (!session || !worklogToDelete) return;

    setDeletingId(worklogToDelete.id);
    setPageError("");

    try {
      await deleteWorkLog(session.token, worklogToDelete.id);
      setWorklogs((current) => current.filter((item) => item.id !== worklogToDelete.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete work log");
    } finally {
      setDeletingId("");
      setWorklogToDelete(null);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="worklogs"
      heading="Work Log List"
      description="Capture the daily harvesting job by land, assigned workers, coconut count, and transport details."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <ConfirmModal
        isOpen={!!worklogToDelete}
        title="Delete Work Log"
        message={`Are you sure you want to delete the work log for ${worklogToDelete?.workDate}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setWorklogToDelete(null)}
      />
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Harvest operations</p>
            <h3>Daily work log</h3>
            <p className="panel-description">
              This is the operational heart of the system. Each work log links land, workers, harvest count, and transport reference.
            </p>
          </div>
        </div>

        <div className="insight-strip">
          <div className="insight-card">
            <span>Logs saved</span>
            <strong>{worklogs.length}</strong>
            <p>Harvest jobs already captured</p>
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
            { header: "Date", accessor: "workDate" },
            {
              header: "Land",
              render: (worklog) => (
                <>
                  <strong>{worklog.landName}</strong>
                  <span>{worklog.notes || "Work log entry"}</span>
                </>
              )
            },
            {
              header: "Supervisor",
              render: (worklog) => worklog.supervisorName || "Not assigned"
            },
            {
              header: "Vehicle",
              render: (worklog) => worklog.vehicleName || "No vehicle"
            },
            {
              header: "Harvest",
              render: (worklog) => (
                <>
                  <strong>{worklog.coconutCount}</strong>
                  <span>{worklog.bagCount} bags</span>
                </>
              )
            },
            {
              header: "Workers",
              render: (worklog) => worklog.assignments.length
            },
            {
              header: "Actions",
              render: (worklog) => (
                <div className="table-actions">
                  <button className="secondary-button table-button" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}>
                    <FaEdit size={16} />
                  </button>
                  <button
                    className="danger-button table-button"
                    type="button"
                    disabled={deletingId === worklog.id}
                    onClick={() => setWorklogToDelete(worklog)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    {deletingId === worklog.id ? "..." : <FaTrash size={16} />}
                  </button>
                </div>
              )
            }
          ]}
          data={worklogs}
          keyExtractor={(item) => item.id}
          emptyState={
            <div className="empty-state-stack">
              <EmptyState
                title="No work logs recorded yet"
                description="Add the first harvesting entry above to connect land, workers, harvest volume, and vehicle usage."
              />
              <Link className="secondary-button" href="/worklogs/add">
                Go to add work log
              </Link>
            </div>
          }
        />
      </article>
    </AppShell>
  );
}
