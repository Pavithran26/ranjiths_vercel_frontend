"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "../../../components/app-shell";
import { SectionTabs } from "../../../components/section-tabs";
import {
  createBuyer,
  createSalesEntry,
  getBuyers,
  getLands,
  getWorkLogs,
  type Buyer,
  type Land,
  type WorkLog
} from "../../../lib/api";
import { clearStoredSession } from "../../../lib/session";
import { useProtectedSession } from "../../../lib/use-protected-session";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/sales", label: "Sales List" },
  { href: "/sales/add", label: "Add Sales Entry" }
];

const initialBuyerForm = {
  name: "",
  phoneNumber: "",
  village: "",
  notes: ""
};

const initialSaleForm = {
  buyerId: "",
  landId: "",
  worklogId: "",
  saleDate: "",
  quantity: "0",
  unitPrice: "0",
  transportCost: "0",
  notes: ""
};

export default function AddSalesPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [worklogs, setWorklogs] = useState<WorkLog[]>([]);
  const [buyerForm, setBuyerForm] = useState(initialBuyerForm);
  const [saleForm, setSaleForm] = useState(initialSaleForm);
  const [pageError, setPageError] = useState("");
  const [savingBuyer, setSavingBuyer] = useState(false);
  const [savingSale, setSavingSale] = useState(false);

  useEffect(() => {
    if (!session) return;
    const loadData = async () => {
      try {
        const [buyerItems, landItems, worklogItems] = await Promise.all([
          getBuyers(session.token),
          getLands(session.token),
          getWorkLogs(session.token)
        ]);
        setBuyers(buyerItems);
        setLands(landItems);
        setWorklogs(worklogItems);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load reference data");
      }
    };
    void loadData();
  }, [session]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleBuyerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setSavingBuyer(true);
    setPageError("");

    try {
      const buyer = await createBuyer(session.token, buyerForm);
      setBuyers((current) => [...current, buyer]);
      setSaleForm((current) => ({ ...current, buyerId: buyer.id }));
      setBuyerForm(initialBuyerForm);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save buyer");
    } finally {
      setSavingBuyer(false);
    }
  };

  const handleSaleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    setSavingSale(true);
    setPageError("");

    try {
      await createSalesEntry(session.token, {
        buyerId: saleForm.buyerId,
        landId: saleForm.landId || undefined,
        worklogId: saleForm.worklogId || undefined,
        saleDate: saleForm.saleDate,
        quantity: Number(saleForm.quantity),
        unitPrice: Number(saleForm.unitPrice),
        transportCost: Number(saleForm.transportCost),
        notes: saleForm.notes
      });
      router.push("/sales");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save sales entry");
    } finally {
      setSavingSale(false);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="sales"
      heading="Add Sales Entry"
      description="Record a new buyer or capture sale quantity, price, and transport cost."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Input data</p>
            <h3>Register new sale</h3>
          </div>
        </div>

        {pageError ? <p className="form-error">{pageError}</p> : null}

        <div className="module-form-grid">
          <form className="data-form two-column-form panel-subsection" onSubmit={handleBuyerSubmit} style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <div className="subsection-heading form-span-two">
              <h4>Add buyer</h4>
            </div>
            <label>
              <span>Buyer name</span>
              <input value={buyerForm.name} onChange={(event) => setBuyerForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              <span>Phone number</span>
              <input value={buyerForm.phoneNumber} onChange={(event) => setBuyerForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
            </label>
            <label>
              <span>Village</span>
              <input value={buyerForm.village} onChange={(event) => setBuyerForm((current) => ({ ...current, village: event.target.value }))} />
            </label>
            <label className="form-span-two">
              <span>Notes</span>
              <textarea rows={4} value={buyerForm.notes} onChange={(event) => setBuyerForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
            <button className="secondary-button form-span-two" type="submit" disabled={savingBuyer}>
              {savingBuyer ? "Saving buyer..." : "Save buyer"}
            </button>
          </form>

          <form className="data-form two-column-form panel-subsection" onSubmit={handleSaleSubmit} style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <div className="subsection-heading form-span-two">
              <h4>Add sales entry</h4>
            </div>
            <label>
              <span>Buyer</span>
              <select value={saleForm.buyerId} onChange={(event) => setSaleForm((current) => ({ ...current, buyerId: event.target.value }))} required>
                <option value="">Select buyer</option>
                {buyers.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Land</span>
              <select value={saleForm.landId} onChange={(event) => setSaleForm((current) => ({ ...current, landId: event.target.value }))}>
                <option value="">Select land</option>
                {lands.map((land) => (
                  <option key={land.id} value={land.id}>
                    {land.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-span-two">
              <span>Related work log</span>
              <select value={saleForm.worklogId} onChange={(event) => setSaleForm((current) => ({ ...current, worklogId: event.target.value }))}>
                <option value="">Select work log</option>
                {worklogs.map((worklog) => (
                  <option key={worklog.id} value={worklog.id}>
                    {worklog.workDate} - {worklog.landName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Sale date</span>
              <input type="date" value={saleForm.saleDate} onChange={(event) => setSaleForm((current) => ({ ...current, saleDate: event.target.value }))} required />
            </label>
            <label>
              <span>Quantity</span>
              <input type="number" min="0" step="1" value={saleForm.quantity} onChange={(event) => setSaleForm((current) => ({ ...current, quantity: event.target.value }))} required />
            </label>
            <label>
              <span>Unit price</span>
              <input type="number" min="0" step="0.01" value={saleForm.unitPrice} onChange={(event) => setSaleForm((current) => ({ ...current, unitPrice: event.target.value }))} required />
            </label>
            <label>
              <span>Transport cost</span>
              <input type="number" min="0" step="0.01" value={saleForm.transportCost} onChange={(event) => setSaleForm((current) => ({ ...current, transportCost: event.target.value }))} required />
            </label>
            <label className="form-span-two">
              <span>Notes</span>
              <textarea rows={4} value={saleForm.notes} onChange={(event) => setSaleForm((current) => ({ ...current, notes: event.target.value }))} />
            </label>
            <button className="primary-button form-span-two" type="submit" disabled={savingSale}>
              {savingSale ? "Saving sale..." : "Save sales entry"}
            </button>
          </form>
        </div>
      </article>
    </AppShell>
  );
}
