"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";
import { UiIcon, type IconName } from "./ui-icon";
import { getStoredSession } from "@/lib/session";
import { NotificationBell } from "./notification-bell";

type AppShellSection = "dashboard" | "lands" | "employees" | "vehicles" | "worklogs" | "sales" | "attendance" | "stores" | "grns";

type AppShellProps = {
  active: AppShellSection;
  heading: string;
  description: string;
  userName: string;
  userRole?: string;
  action?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
};

type NavItem = {
  key: AppShellSection;
  label: string;
  href: string;
  icon: IconName;
};

const primaryNav: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { key: "lands", label: "Lands", href: "/lands", icon: "land" },
  { key: "employees", label: "Employees", href: "/employees", icon: "employee" },
  { key: "vehicles", label: "Vehicles", href: "/vehicles", icon: "vehicle" },
  { key: "worklogs", label: "Work Logs", href: "/worklogs", icon: "workflow" },
  { key: "sales", label: "Sales", href: "/sales", icon: "sales" },
  { key: "stores", label: "Stores/Hubs", href: "/stores", icon: "dashboard" },
  { key: "grns", label: "Receipts (GRN)", href: "/grns", icon: "workflow" }
];

const secondaryModules: Array<{ label: string; icon: IconName }> = [
  { label: "Expense Book", icon: "expense" },
  { label: "Reports", icon: "reports" }
];

export function AppShell({
  active,
  heading,
  description,
  userName,
  userRole = "Admin",
  action,
  onLogout,
  children
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    if (session?.user.profileImage) {
      setProfileImage(session.user.profileImage);
    }
  }, []);

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    weekday: "short"
  }).format(new Date());

  return (
    <main className={`workspace-shell ${!isSidebarOpen ? "is-sidebar-collapsed" : ""}`}>
      <aside className="workspace-sidebar">
        <div className="sidebar-top">
          <BrandLogo />

          <div className="sidebar-group">
            <p className="sidebar-label">Operations</p>
            <nav className="workspace-nav">
              {primaryNav.map((item) => (
                <Link
                  key={item.key}
                  className={active === item.key ? "nav-link is-active" : "nav-link"}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="nav-icon">
                    <UiIcon height={18} name={item.icon} width={18} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-summary">
            <div className="user-avatar">{userName.slice(0, 1).toUpperCase()}</div>
            <div>
              <p className="footer-label">Signed in</p>
              <strong>{userName}</strong>
              <p className="user-role">{userRole}</p>
            </div>
          </div>

          <button className="logout-button" type="button" onClick={onLogout}>
            <UiIcon height={16} name="logout" width={16} />
            <span>Log out</span>
          </button>

        </div>
      </aside>

      <section className="workspace-content">
        <header className="workspace-topbar">
          <div className="topbar-title">
            <button 
              className="icon-button topbar-menu-button" 
              type="button" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle menu"
            >
              <UiIcon height={20} name="menu" width={20} />
            </button>
            <div>
              <p className="eyebrow">Coconut operations</p>
              <h1>{heading}</h1>
            </div>
          </div>

          <div className="topbar-tools">
            <ThemeToggle />
            <div className="topbar-date">{todayLabel}</div>
            <NotificationBell />
            <Link href="/profile" className="profile-chip" title="Edit Profile" style={{ textDecoration: "none" }}>
              <span className="profile-avatar" style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {profileImage ? (
                  <img src={profileImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  userName.slice(0, 1).toUpperCase()
                )}
              </span>
              <div>
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>
            </Link>
          </div>
        </header>

        <section className="workspace-hero">
          <div>
            <p className="eyebrow">Field office workspace</p>
            <h2>{heading}</h2>
            <p>{description}</p>
          </div>
          {action ? <div className="workspace-hero-action">{action}</div> : null}
        </section>

        {children}

        <footer className="workspace-footer">
          <p>
            This Software is Developed and Managed by{" "}
            <a href="https://github.com/Pavithran26" target="_blank" rel="noopener noreferrer">
              Pavithran S
            </a>
          </p>
        </footer>
      </section>
    </main>
  );
}
