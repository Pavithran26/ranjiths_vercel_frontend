"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SectionTabs } from "@/components/section-tabs";
import {
  getLand,
  updateLand,
  getLandOwners,
  type LandOwner
} from "@/lib/api";
import { clearStoredSession } from "@/lib/session";
import { useProtectedSession } from "@/lib/use-protected-session";

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

export default function EditLandPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [owners, setOwners] = useState<LandOwner[]>([]);
  const [landForm, setLandForm] = useState(initialLandForm);
  const [pageError, setPageError] = useState("");
  const [savingLand, setSavingLand] = useState(false);
  const [loadingLand, setLoadingLand] = useState(true);

  useEffect(() => {
    if (!session || !params.id) return;
    const loadData = async () => {
      try {
        const [ownersData, landData] = await Promise.all([
          getLandOwners(session.token),
          getLand(session.token, params.id)
        ]);
        setOwners(ownersData);
        setLandForm({
          ownerId: landData.ownerId,
          name: landData.name,
          village: landData.village,
          areaAcres: String(landData.areaAcres),
          leaseStartDate: landData.leaseStartDate,
          leaseEndDate: landData.leaseEndDate,
          leaseAmount: String(landData.leaseAmount),
          treeCount: String(landData.treeCount),
          leaseNotes: landData.leaseNotes || "",
          isActive: landData.isActive,
          latitude: landData.latitude != null ? String(landData.latitude) : "",
          longitude: landData.longitude != null ? String(landData.longitude) : "",
          location: landData.location || ""
        });
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load land data");
      } finally {
        setLoadingLand(false);
      }
    };
    void loadData();
  }, [params.id, session]);

  const tabs = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/lands", label: "Land List" },
    { href: "/lands/add", label: "Add Land" },
    { href: `/lands/${params.id}/edit`, label: "Edit Land" }
  ];

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleUpdateLand = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !params.id) return;
    setSavingLand(true);
    setPageError("");
    try {
      await updateLand(session.token, params.id, {
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
      setPageError(error instanceof Error ? error.message : "Unable to update land");
    } finally {
      setSavingLand(false);
    }
  };

  if (loading || !session || loadingLand) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="lands"
      heading="Edit Land"
      description="Update leased land and coordinates details."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Update details</p>
            <h3>Edit land lease record</h3>
          </div>
        </div>

        {pageError ? <p className="form-error">{pageError}</p> : null}

        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <form className="data-form two-column-form panel-subsection" onSubmit={handleUpdateLand} style={{ background: "white", border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 12px rgba(0,0,0,0.02)", padding: "2rem", borderRadius: "12px" }}>
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
            <label className="form-span-two" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={landForm.isActive} onChange={(event) => setLandForm((current) => ({ ...current, isActive: event.target.checked }))} style={{ width: "auto" }} />
              <span>Is Active</span>
            </label>
            <button className="primary-button form-span-two" type="submit" disabled={savingLand}>
              {savingLand ? "Updating land..." : "Update land"}
            </button>
          </form>
        </div>
      </article>
    </AppShell>
  );
}
