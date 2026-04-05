"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { BrandLogo } from "./brand-logo";
import { UiIcon, type IconName } from "./ui-icon";

type AppShellSection = "dashboard" | "lands" | "employees" | "vehicles" | "worklogs" | "sales" | "attendance";

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
  { key: "lands", label: "Land Master", href: "/lands", icon: "land" },
  { key: "employees", label: "Employee Master", href: "/employees", icon: "employee" },
  { key: "vehicles", label: "Vehicle Master", href: "/vehicles", icon: "vehicle" },
  { key: "worklogs", label: "Work Log Entry", href: "/worklogs", icon: "workflow" },
  { key: "sales", label: "Sales Entry", href: "/sales", icon: "sales" }
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
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    weekday: "short"
  }).format(new Date());

  return (
    <main className="workspace-shell">
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
                >
                  <span className="nav-icon">
                    <UiIcon height={18} name={item.icon} width={18} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="sidebar-group">
            <p className="sidebar-label">Roadmap</p>
            <div className="sidebar-stack">
              {secondaryModules.map((item) => (
                <div key={item.label} className="sidebar-item">
                  <span className="nav-icon">
                    <UiIcon height={18} name={item.icon} width={18} />
                  </span>
                  <span>{item.label}</span>
                  <span className="sidebar-badge">Soon</span>
                </div>
              ))}
            </div>
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
            <span className="topbar-icon">
              <UiIcon height={20} name="menu" width={20} />
            </span>
            <div>
              <p className="eyebrow">Coconut operations</p>
              <h1>{heading}</h1>
            </div>
          </div>

          <div className="topbar-tools">
            <div className="topbar-date">{todayLabel}</div>
            <button className="icon-button" type="button" aria-label="Notifications">
              <UiIcon height={18} name="bell" width={18} />
            </button>
            <div className="profile-chip">
              <span className="profile-avatar">{userName.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{userName}</strong>
                <span>{userRole}</span>
              </div>
            </div>
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
      </section>
    </main>
  );
}
