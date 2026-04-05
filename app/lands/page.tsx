"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import {
  createLand,
  createLandOwner,
  getLands,
  getLandOwners,
  type Land,
  type LandOwner
} from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useProtectedSession } from "../../lib/use-protected-session";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lands", label: "Land master" }
];

const initialOwnerForm = {
  name: "",
  phoneNumber: "",
  village: "",
  address: ""
};

const initialLandForm = {
  ownerId: "",
  name: "",
  village: "",
  areaAcres: "0",
  leaseStartDate: "",
  leaseEndDate: "",
  leaseAmount: "0",
  treeCount: "0",
  leaseNotes: "",
  isActive: true
};

export default function LandsPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [owners, setOwners] = useState<LandOwner[]>([]);
  const [lands, setLands] = useState<Land[]>([]);
  const [ownerForm, setOwnerForm] = useState(initialOwnerForm);
  const [landForm, setLandForm] = useState(initialLandForm);
  const [pageError, setPageError] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);
  const [savingLand, setSavingLand] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadData = async () => {
      try {
        const [ownerItems, landItems] = await Promise.all([
          getLandOwners(session.token),
          getLands(session.token)
        ]);
        setOwners(ownerItems);
        setLands(landItems);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load lands");
      }
    };

    void loadData();
  }, [session]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleCreateOwner = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSavingOwner(true);
    setPageError("");

    try {
      const owner = await createLandOwner(session.token, ownerForm);
      setOwners((current) => [...current, owner]);
      setLandForm((current) => ({ ...current, ownerId: owner.id, village: current.village || owner.village }));
      setOwnerForm(initialOwnerForm);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save land owner");
    } finally {
      setSavingOwner(false);
    }
  };

  const handleCreateLand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      return;
    }

    setSavingLand(true);
    setPageError("");

    try {
      const land = await createLand(session.token, {
        ownerId: landForm.ownerId,
        name: landForm.name,
        village: landForm.village,
        areaAcres: Number(landForm.areaAcres),
        leaseStartDate: landForm.leaseStartDate,
        leaseEndDate: landForm.leaseEndDate,
        leaseAmount: Number(landForm.leaseAmount),
        treeCount: Number(landForm.treeCount),
        leaseNotes: landForm.leaseNotes,
        isActive: landForm.isActive
      });
      setLands((current) => [land, ...current]);
      setLandForm(initialLandForm);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to save land");
    } finally {
      setSavingLand(false);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="lands"
      heading="Land Master"
      description="Register land owners, gudhagai lease details, acreage, and tree count in one master ledger."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
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

        <div className="module-form-grid">
          <form className="data-form panel-subsection" onSubmit={handleCreateOwner}>
            <div className="subsection-heading">
              <h4>Add land owner</h4>
              <p>Create the owner record once and reuse it for multiple lands.</p>
            </div>

            <label>
              <span>Owner name</span>
              <input value={ownerForm.name} onChange={(event) => setOwnerForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              <span>Phone number</span>
              <input value={ownerForm.phoneNumber} onChange={(event) => setOwnerForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
            </label>
            <label>
              <span>Village</span>
              <input value={ownerForm.village} onChange={(event) => setOwnerForm((current) => ({ ...current, village: event.target.value }))} />
            </label>
            <label>
              <span>Address</span>
              <textarea rows={4} value={ownerForm.address} onChange={(event) => setOwnerForm((current) => ({ ...current, address: event.target.value }))} />
            </label>
            <button className="secondary-button" type="submit" disabled={savingOwner}>
              {savingOwner ? "Saving owner..." : "Save owner"}
            </button>
          </form>

          <form className="data-form panel-subsection" onSubmit={handleCreateLand}>
            <div className="subsection-heading">
              <h4>Add land</h4>
              <p>Record the lease period, gudhagai amount, and tree count for this land.</p>
            </div>

            <label>
              <span>Owner</span>
              <select value={landForm.ownerId} onChange={(event) => setLandForm((current) => ({ ...current, ownerId: event.target.value }))} required>
                <option value="">Select owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Land name</span>
              <input value={landForm.name} onChange={(event) => setLandForm((current) => ({ ...current, name: event.target.value }))} required />
            </label>
            <label>
              <span>Village</span>
              <input value={landForm.village} onChange={(event) => setLandForm((current) => ({ ...current, village: event.target.value }))} required />
            </label>
            <label>
              <span>Area in acres</span>
              <input type="number" min="0" step="0.01" value={landForm.areaAcres} onChange={(event) => setLandForm((current) => ({ ...current, areaAcres: event.target.value }))} required />
            </label>
            <label>
              <span>Lease start date</span>
              <input type="date" value={landForm.leaseStartDate} onChange={(event) => setLandForm((current) => ({ ...current, leaseStartDate: event.target.value }))} required />
            </label>
            <label>
              <span>Lease end date</span>
              <input type="date" value={landForm.leaseEndDate} onChange={(event) => setLandForm((current) => ({ ...current, leaseEndDate: event.target.value }))} required />
            </label>
            <label>
              <span>Lease amount</span>
              <input type="number" min="0" step="0.01" value={landForm.leaseAmount} onChange={(event) => setLandForm((current) => ({ ...current, leaseAmount: event.target.value }))} required />
            </label>
            <label>
              <span>Tree count</span>
              <input type="number" min="0" step="1" value={landForm.treeCount} onChange={(event) => setLandForm((current) => ({ ...current, treeCount: event.target.value }))} required />
            </label>
            <label className="form-span-two">
              <span>Lease notes</span>
              <textarea rows={4} value={landForm.leaseNotes} onChange={(event) => setLandForm((current) => ({ ...current, leaseNotes: event.target.value }))} />
            </label>
            <button className="primary-button form-span-two" type="submit" disabled={savingLand}>
              {savingLand ? "Saving land..." : "Save land"}
            </button>
          </form>
        </div>

        {lands.length === 0 ? (
          <div className="empty-state-stack">
            <EmptyState
              title="No lands registered yet"
              description="Start with the owner and land forms above so work logs can be linked to the correct grove."
            />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Land</th>
                  <th>Owner</th>
                  <th>Village</th>
                  <th>Lease</th>
                  <th>Tree count</th>
                </tr>
              </thead>
              <tbody>
                {lands.map((land) => (
                  <tr key={land.id}>
                    <td>
                      <strong>{land.name}</strong>
                      <span>{land.areaAcres.toFixed(2)} acres</span>
                    </td>
                    <td>{land.ownerName}</td>
                    <td>{land.village}</td>
                    <td>
                      <strong>Rs {land.leaseAmount.toFixed(0)}</strong>
                      <span>
                        {land.leaseStartDate} to {land.leaseEndDate}
                      </span>
                    </td>
                    <td>{land.treeCount}</td>
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
