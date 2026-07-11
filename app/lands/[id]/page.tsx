"use client";

import { startTransition, useEffect, useState, type FormEvent, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaTrash } from "react-icons/fa";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  getLand,
  getLandPayments,
  createLandPayment,
  deleteLandPayment,
  type Land,
  type LandLeasePayment
} from "@/lib/api";
import { clearStoredSession } from "@/lib/session";
import { useProtectedSession } from "@/lib/use-protected-session";
import { DataTable } from "@/components/data-table";

const initialPaymentForm = {
  paymentDate: "",
  amount: "",
  paymentType: "emi" as "advance" | "emi" | "other",
  notes: ""
};

export default function LandLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { loading, session } = useProtectedSession();
  const [land, setLand] = useState<Land | null>(null);
  const [payments, setPayments] = useState<LandLeasePayment[]>([]);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [pageError, setPageError] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [paymentToDelete, setPaymentToDelete] = useState<LandLeasePayment | null>(null);

  const loadData = async () => {
    if (!session) return;
    try {
      const [landData, paymentData] = await Promise.all([
        getLand(session.token, id),
        getLandPayments(session.token, { land: id })
      ]);
      setLand(landData);
      setPayments(paymentData);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load land ledger");
    }
  };

  useEffect(() => {
    if (session) {
      void loadData();
    }
  }, [session, id]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !land) return;
    setSavingPayment(true);
    setPageError("");

    try {
      const amountNum = Number(paymentForm.amount);
      if (amountNum > land.balanceDue) {
        setPageError(`Payment amount (Rs ${amountNum}) exceeds the remaining balance (Rs ${land.balanceDue}).`);
        setSavingPayment(false);
        return;
      }

      await createLandPayment(session.token, {
        landId: land.id,
        paymentDate: paymentForm.paymentDate,
        amount: Number(paymentForm.amount),
        paymentType: paymentForm.paymentType,
        notes: paymentForm.notes
      });
      setPaymentForm(initialPaymentForm);
      // Reload land to get updated balance and totalPaid
      void loadData();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save payment");
    } finally {
      setSavingPayment(false);
    }
  };

  const confirmDelete = async () => {
    if (!session || !paymentToDelete) return;

    setDeletingId(paymentToDelete.id);
    setPageError("");

    try {
      await deleteLandPayment(session.token, paymentToDelete.id);
      void loadData(); // Reload to update balances
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete payment");
    } finally {
      setDeletingId("");
      setPaymentToDelete(null);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  if (!land) {
    return <main className="loading-screen">Loading land data...</main>;
  }

  return (
    <AppShell
      active="lands"
      heading={`Land Ledger: ${land.name}`}
      description={`Track lease payments, advance, and EMI installments for ${land.ownerName}.${
        land.location ? ` Location: ${land.location}.` : ""
      }${
        land.latitude != null && land.longitude != null ? ` Coordinates: ${land.latitude}, ${land.longitude}.` : ""
      }`}
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <ConfirmModal
        isOpen={!!paymentToDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete this Rs ${paymentToDelete?.amount} payment?`}
        onConfirm={confirmDelete}
        onCancel={() => setPaymentToDelete(null)}
      />

      <div style={{ marginBottom: "1rem" }}>
        <Link href="/lands" style={{ color: "var(--brand-deep)", textDecoration: "none", fontWeight: 500 }}>
          &larr; Back to lands
        </Link>
      </div>

      <section className="stats-grid" style={{ marginBottom: "2rem" }}>
        <div className="insight-card" style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Total Lease Amount</span>
          <strong style={{ display: "block", fontSize: "1.5rem", marginTop: "0.5rem" }}>Rs {land.leaseAmount.toLocaleString()}</strong>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>{land.leaseStartDate} to {land.leaseEndDate}</p>
        </div>
        <div className="insight-card" style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Total Paid (Advance + EMI)</span>
          <strong style={{ display: "block", fontSize: "1.5rem", marginTop: "0.5rem", color: "var(--brand-success)" }}>Rs {land.totalPaid.toLocaleString()}</strong>
          <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>Across {payments.length} payments</p>
        </div>
        <div className="insight-card" style={{ background: "white", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>Balance Due</span>
          <strong style={{ display: "block", fontSize: "1.5rem", marginTop: "0.5rem", color: land.balanceDue > 0 ? "var(--brand-error)" : "var(--brand-success)" }}>Rs {land.balanceDue.toLocaleString()}</strong>
        </div>
      </section>

      {pageError ? <p className="form-error">{pageError}</p> : null}

      <div className="content-grid dashboard-grid">
        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Payment History</p>
              <h3>Ledger</h3>
            </div>
          </div>
          <DataTable
            columns={[
              { header: "Date", accessor: "paymentDate" },
              { 
                header: "Type", 
                render: (p) => p.paymentType === "advance" ? "Advance Payment" : p.paymentType === "emi" ? "EMI Installment" : "Other" 
              },
              { 
                header: "Amount", 
                render: (p) => <strong style={{ color: "var(--brand-success)" }}>Rs {p.amount.toLocaleString()}</strong> 
              },
              { header: "Notes", accessor: "notes" },
              {
                header: "Actions",
                render: (p) => (
                  <button
                    className="danger-button table-button"
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={() => setPaymentToDelete(p)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    {deletingId === p.id ? "..." : <FaTrash size={16} />}
                  </button>
                )
              }
            ]}
            data={payments}
            keyExtractor={(item) => item.id}
            emptyState={
              <EmptyState
                title="No payments yet"
                description="Use the form to record the first advance or EMI payment."
              />
            }
          />
        </article>

        <article className="panel-card" style={{ alignSelf: "start" }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">New Entry</p>
              <h3>Record Payment</h3>
            </div>
          </div>
          <form className="data-form" onSubmit={handlePaymentSubmit}>
            <label>
              <span>Payment type</span>
              <select value={paymentForm.paymentType} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentType: event.target.value as any }))} required>
                <option value="emi">EMI Installment</option>
                <option value="advance">Advance Payment</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              <span>Payment date</span>
              <input type="date" value={paymentForm.paymentDate} onChange={(event) => setPaymentForm((current) => ({ ...current, paymentDate: event.target.value }))} required />
            </label>
            <label>
              <span>Amount (Rs)</span>
              <input type="number" min="1" step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} required />
            </label>
            <label>
              <span>Notes / Reference</span>
              <textarea rows={3} value={paymentForm.notes} onChange={(event) => setPaymentForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
            <button className="primary-button" type="submit" disabled={savingPayment}>
              {savingPayment ? "Saving..." : "Record payment"}
            </button>
          </form>
        </article>
      </div>
    </AppShell>
  );
}
