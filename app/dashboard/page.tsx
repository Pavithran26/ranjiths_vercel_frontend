"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { ModuleGrid } from "../../components/module-grid";
import { StatsCard } from "../../components/stats-card";
import {
  getDashboardSummary,
  getEmployeeWorkReport,
  getLandProductionReport,
  getProfitLossReport,
  type DashboardSummary,
  type EmployeeWorkReportItem,
  type LandProductionReportItem,
  type ProfitLossReport
} from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useProtectedSession } from "../../lib/use-protected-session";

const emptySummary: DashboardSummary = {
  totalLands: 0,
  activeWorkers: 0,
  dailyHarvest: 0,
  totalRevenue: 0
};

const emptyProfit: ProfitLossReport = {
  totalRevenue: 0,
  totalExpenses: 0,
  totalProfit: 0,
  monthlyBreakdown: []
};

const moduleItems = [
  {
    title: "Land Master",
    description: "Track land owner details, gudhagai lease terms, acreage, and tree count.",
    icon: "land" as const,
    href: "/lands"
  },
  {
    title: "Employee Master",
    description: "Store field workers, supervisors, departments, daily wages, and roles.",
    icon: "employee" as const,
    href: "/employees"
  },
  {
    title: "Vehicle Master",
    description: "Maintain truck details, driver contacts, capacity, and trip references.",
    icon: "vehicle" as const,
    href: "/vehicles"
  },
  {
    title: "Work Log Entry",
    description: "Capture the daily coconut harvest, assigned workers, GPS-ready fields, and vehicle use.",
    icon: "workflow" as const,
    href: "/worklogs"
  },
  {
    title: "Sales Entry",
    description: "Record buyer sales, price per coconut, transport cost, and overall revenue.",
    icon: "sales" as const,
    href: "/sales"
  },
  {
    title: "Expense Book",
    description: "Wages, transport, fuel, lease, maintenance, and future P&L tracking.",
    icon: "expense" as const,
    status: "planned" as const
  }
];

export default function DashboardPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [landReport, setLandReport] = useState<LandProductionReportItem[]>([]);
  const [employeeReport, setEmployeeReport] = useState<EmployeeWorkReportItem[]>([]);
  const [profitReport, setProfitReport] = useState<ProfitLossReport>(emptyProfit);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadDashboard = async () => {
      try {
        const [summaryData, landData, employeeData, profitData] = await Promise.all([
          getDashboardSummary(session.token),
          getLandProductionReport(session.token),
          getEmployeeWorkReport(session.token),
          getProfitLossReport(session.token)
        ]);

        setSummary(summaryData);
        setLandReport(landData.slice(0, 4));
        setEmployeeReport(employeeData.slice(0, 4));
        setProfitReport(profitData);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load dashboard");
      }
    };

    void loadDashboard();
  }, [session]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="dashboard"
      heading="Coconut ERP Dashboard"
      description="A production-style command view for leased lands, field workers, harvesting work logs, transport planning, and profit tracking."
      userName={session.user.name}
      userRole={session.user.role}
      action={
        <Link className="primary-button" href="/worklogs">
          Add today&apos;s work log
        </Link>
      }
      onLogout={handleLogout}
    >
      <section className="stats-grid">
        <StatsCard helper="Leased lands currently active" icon="land" label="Total lands" value={String(summary.totalLands)} />
        <StatsCard helper="Workers available for assignment" icon="employee" label="Active workers" value={String(summary.activeWorkers)} />
        <StatsCard helper="Coconuts recorded in today's work logs" icon="workflow" label="Daily harvest" value={String(summary.dailyHarvest)} />
        <StatsCard helper="Gross revenue from sales entries" icon="sales" label="Total revenue" value={`Rs ${summary.totalRevenue.toFixed(0)}`} />
      </section>

      <section className="content-grid dashboard-grid">
        <article className="panel-card dashboard-primary">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Business modules</p>
              <h3>Core operational workspace</h3>
              <p className="panel-description">
                These modules match your real business flow: lease land, send workers, harvest coconuts, transport, sell, and measure profit.
              </p>
            </div>
          </div>

          {pageError ? <p className="form-error">{pageError}</p> : null}

          <ModuleGrid items={moduleItems} />
        </article>

        <article className="panel-card dashboard-flow">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Live reports</p>
              <h3>What the backend is already calculating</h3>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-list-item">
              <span className="flow-item-icon">1</span>
              <div>
                <strong>Top land production</strong>
                <p>
                  {landReport[0]
                    ? `${landReport[0].name} leads with ${landReport[0].totalCoconuts} coconuts across ${landReport[0].totalWorkLogs} work logs.`
                    : "Land-wise production report will appear as soon as work logs are recorded."}
                </p>
              </div>
            </div>
            <div className="flow-list-item">
              <span className="flow-item-icon">2</span>
              <div>
                <strong>Employee work report</strong>
                <p>
                  {employeeReport[0]
                    ? `${employeeReport[0].name} currently has ${employeeReport[0].assignmentCount} work assignments in the report.`
                    : "Employee assignment analytics will appear after work logs are saved."}
                </p>
              </div>
            </div>
            <div className="flow-list-item">
              <span className="flow-item-icon">3</span>
              <div>
                <strong>Profit and loss</strong>
                <p>
                  Revenue Rs {profitReport.totalRevenue.toFixed(0)} against expenses Rs {profitReport.totalExpenses.toFixed(0)} gives a current profit of Rs {profitReport.totalProfit.toFixed(0)}.
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-note">
            <strong>Architecture upgrade</strong>
            <p>
              This dashboard now reads from the modular DRF `v1` API with JWT auth, role-ready users, and PostgreSQL-friendly business entities.
            </p>
          </div>
        </article>
      </section>
    </AppShell>
  );
}
