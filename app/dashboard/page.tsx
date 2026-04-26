"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { StatsCard } from "../../components/stats-card";
import { FinancialOverview } from "../../components/financial-overview";
import { LandProductionDonut } from "../../components/charts/land-production-donut";
import { Leaderboard, type LeaderboardItem } from "../../components/leaderboard";
import { QuickActions } from "../../components/quick-actions";

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

const quickActionItems = [
  {
    title: "Add Work Log",
    description: "Capture daily harvest and worker assignments",
    icon: "workflow" as const,
    href: "/worklogs/new"
  },
  {
    title: "Record Sales",
    description: "Enter revenue from coconut buyers",
    icon: "sales" as const,
    href: "/sales/new"
  },
  {
    title: "Manage Lands",
    description: "View and update lease details",
    icon: "land" as const,
    href: "/lands"
  },
  {
    title: "Employee Roster",
    description: "Update worker statuses and roles",
    icon: "employee" as const,
    href: "/employees"
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



  const topEmployees: LeaderboardItem[] = employeeReport.map((e) => ({
    id: e.id,
    name: e.name,
    subtext: e.role,
    metric: `${e.assignmentCount} logs`
  }));

  return (
    <AppShell
      active="dashboard"
      heading="Coconut ERP Dashboard"
      description="Your operational command center for tracking lands, field workers, harvests, and profit metrics."
      userName={session.user.name}
      userRole={session.user.role}
      action={
        <Link className="primary-button" href="/worklogs">
          Add today&apos;s work log
        </Link>
      }
      onLogout={handleLogout}
    >
      {pageError ? <p className="form-error">{pageError}</p> : null}

      <section className="stats-grid">
        <StatsCard helper="Leased lands currently active" icon="land" label="Total lands" value={String(summary.totalLands)} />
        <StatsCard helper="Workers available for assignment" icon="employee" label="Active workers" value={String(summary.activeWorkers)} />
        <StatsCard helper="Coconuts recorded in today's work logs" icon="workflow" label="Daily harvest" value={String(summary.dailyHarvest)} />
        <StatsCard helper="Gross revenue from sales entries" icon="sales" label="Total revenue" value={`Rs ${summary.totalRevenue.toFixed(0)}`} />
      </section>

      <section className="content-grid dashboard-grid">
        <div style={{ display: "grid", gap: "18px" }}>
          <FinancialOverview report={profitReport} />
          <div className="dashboard-row">
            <LandProductionDonut report={landReport} />
            <Leaderboard 
              title="Top Employees" 
              icon="employee" 
              items={topEmployees} 
              emptyText="No employee assignment data available." 
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: "18px", alignContent: "start" }}>
          <QuickActions items={quickActionItems} />
        </div>
      </section>
    </AppShell>
  );
}
