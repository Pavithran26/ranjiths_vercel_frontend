"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionTabs } from "@/components/section-tabs";
import {
  createLand,
  createLandOwner,
  getLandOwners,
  type LandOwner
} from "@/lib/api";
import { clearStoredSession } from "@/lib/session";
import { useProtectedSession } from "@/lib/use-protected-session";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/lands", label: "Land List" },
  { href: "/lands/add", label: "Add Land" }
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
  isActive: true,
  latitude: "",
  longitude: "",
  location: ""
};

export default function AddLandPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [owners, setOwners] = useState<LandOwner[]>([]);
  const [ownerForm, setOwnerForm] = useState(initialOwnerForm);
  const [landForm, setLandForm] = useState(initialLandForm);
  const [pageError, setPageError] = useState("");
  const [savingOwner, setSavingOwner] = useState(false);
  const [savingLand, setSavingLand] = useState(false);

  useEffect(() => {
    if (!session) return;
    const loadData = async () => {
      try {
        setOwners(await getLandOwners(session.token));
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load land owners");
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
    if (!session) return;
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
    if (!session) return;
    setSavingLand(true);
    setPageError("");
    try {
      await createLand(session.token, {
        ownerId: landForm.ownerId,
        name: landForm.name,
        village: landForm.village,
        areaAcres: Number(landForm.areaAcres),
        leaseStartDate: landForm.leaseStartDate,
        leaseEndDate: landForm.leaseEndDate,
        leaseAmount: Number(landForm.leaseAmount),
        treeCount: Number(landForm.treeCount),
        leaseNotes: landForm.leaseNotes,
        isActive: landForm.isActive,
        latitude: landForm.latitude ? Number(landForm.latitude) : null,
        longitude: landForm.longitude ? Number(landForm.longitude) : null,
        location: landForm.location || null
      });
      router.push("/lands");
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
      heading="Add Land"
      description="Register new land owners and gudhagai lease details."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Input data</p>
            <h3>Register new land lease</h3>
          </div>
        </div>

        {pageError ? <p className="form-error">{pageError}</p> : null}

        <div className="module-form-grid">
          <form className="data-form two-column-form panel-subsection" onSubmit={handleCreateOwner} style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <div className="subsection-heading form-span-two">
              <h4>Add land owner</h4>
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
            <label className="form-span-two">
              <span>Address</span>
              <textarea rows={4} value={ownerForm.address} onChange={(event) => setOwnerForm((current) => ({ ...current, address: event.target.value }))} />
            </label>
            <button className="secondary-button form-span-two" type="submit" disabled={savingOwner}>
              {savingOwner ? "Saving owner..." : "Save owner"}
            </button>
          </form>

          <form className="data-form two-column-form panel-subsection" onSubmit={handleCreateLand} style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
            <div className="subsection-heading form-span-two">
              <h4>Add land</h4>
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
              <span>Total lease amount</span>
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
            <label className="form-span-two">
              <span>Location Description</span>
              <input value={landForm.location} onChange={(event) => setLandForm((current) => ({ ...current, location: event.target.value }))} placeholder="E.g., North Field, near main road" />
            </label>
            <label>
              <span>Latitude</span>
              <input type="number" min="-90" max="90" step="0.000001" value={landForm.latitude} onChange={(event) => setLandForm((current) => ({ ...current, latitude: event.target.value }))} placeholder="E.g., 11.012345" />
            </label>
            <label>
              <span>Longitude</span>
              <input type="number" min="-180" max="180" step="0.000001" value={landForm.longitude} onChange={(event) => setLandForm((current) => ({ ...current, longitude: event.target.value }))} placeholder="E.g., 77.012345" />
            </label>
            <button className="primary-button form-span-two" type="submit" disabled={savingLand}>
              {savingLand ? "Saving land..." : "Save land"}
            </button>
          </form>
        </div>
      </article>
    </AppShell>
  );
}
