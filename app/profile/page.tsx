"use client";

import { startTransition, useState, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaCamera, FaKey } from "react-icons/fa";

import { AppShell } from "../../components/app-shell";
import { updateProfile } from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useProtectedSession } from "../../lib/use-protected-session";

export default function ProfilePage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(session?.user.username || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(session?.user.profileImage || null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateProfile(session.token, {
        username: username !== session.user.username ? username : undefined,
        password: password || undefined,
        profileImage: profileImage || undefined
      });
      setSuccess("Profile updated successfully! Some changes may require a fresh login to reflect fully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking session...</main>;
  }

  return (
    <AppShell
      active="dashboard"
      heading="My Profile"
      description="Manage your account settings, security, and profile identity."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <div className="content-grid dashboard-grid" style={{ gridTemplateColumns: "1fr" }}>
        <article className="panel-card" style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Account Settings</p>
              <h3>Edit Profile</h3>
            </div>
          </div>

          {error && <p className="form-error" style={{ marginBottom: "1rem" }}>{error}</p>}
          {success && <p style={{ color: "var(--brand)", marginBottom: "1rem", fontWeight: 600 }}>{success}</p>}

          <form className="data-form two-column-form" onSubmit={handleSubmit}>
            <div className="form-span-two" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div 
                style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "30px", 
                  background: "var(--surface-muted)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "2px solid var(--brand-soft)",
                  position: "relative",
                  cursor: "pointer"
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <FaUser size={48} color="var(--brand)" />
                )}
                <div style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  insetInline: 0, 
                  background: "rgba(0,0,0,0.4)", 
                  color: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  height: "32px",
                  fontSize: "0.8rem"
                }}>
                  <FaCamera style={{ marginRight: "4px" }} /> Change
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                style={{ display: "none" }} 
              />
              <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Click the avatar to upload a new profile image</p>
            </div>

            <label>
              <span>Username</span>
              <div style={{ position: "relative" }}>
                <input 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  style={{ paddingLeft: "3rem" }}
                />
                <FaUser style={{ position: "absolute", left: "1.2rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
              </div>
            </label>

            <label>
              <span>Email Address</span>
              <input value={session.user.email || ""} disabled style={{ background: "var(--surface-muted)", cursor: "not-allowed" }} />
            </label>

            <div className="form-span-two" style={{ margin: "1.5rem 0 0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-deep)" }}>
                <FaKey size={14} />
                <h4 style={{ margin: 0 }}>Security Settings</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "4px" }}>Leave password fields blank if you don't want to change it.</p>
            </div>

            <label>
              <span>New Password</span>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Minimum 8 characters"
              />
            </label>

            <label>
              <span>Confirm New Password</span>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Re-type your new password"
              />
            </label>

            <button 
              className="primary-button form-span-two" 
              type="submit" 
              disabled={saving}
              style={{ marginTop: "1rem" }}
            >
              {saving ? "Saving Changes..." : "Update Profile"}
            </button>
          </form>
        </article>
      </div>
    </AppShell>
  );
}
