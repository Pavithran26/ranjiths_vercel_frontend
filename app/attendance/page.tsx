import { AttendanceTable } from "../../components/attendance-table";
import { Header } from "../../components/header";
import { StatsCard } from "../../components/stats-card";
import {
  getAttendanceRecords,
  getAttendanceSummary,
  type AttendanceRecord,
  type AttendanceSummary,
} from "../../lib/api";

const EMPTY_SUMMARY: AttendanceSummary = {
  todayPresent: 0,
  lateArrivals: 0,
  remoteEmployees: 0,
  attendanceRate: 0,
};

export default async function AttendancePage() {
  let summary: AttendanceSummary = EMPTY_SUMMARY;
  let records: AttendanceRecord[] = [];
  let backendError = false;

  try {
    [summary, records] = await Promise.all([
      getAttendanceSummary(),
      getAttendanceRecords(),
    ]);
  } catch (err) {
    console.error("[AttendancePage] Failed to load data from backend:", err);
    backendError = true;
  }

  return (
    <main className="page-shell">
      <Header
        title="Attendance overview"
        subtitle="Monitor check-ins, late arrivals, and remote activity across your organization from one place."
      />

      {backendError && (
        <div className="error-banner" role="alert">
          <strong>Data unavailable</strong> — the backend service could not be
          reached. Showing empty data. Please try refreshing the page.
        </div>
      )}

      <section className="stats-grid">
        <StatsCard label="Present today" value={String(summary.todayPresent)} helper="Employees marked present, late, or remote" />
        <StatsCard label="Late arrivals" value={String(summary.lateArrivals)} helper="People who checked in after the start window" />
        <StatsCard label="Remote" value={String(summary.remoteEmployees)} helper="Team members currently working off-site" />
        <StatsCard label="Attendance rate" value={`${summary.attendanceRate}%`} helper="Real-time attendance completion" />
      </section>

      <AttendanceTable records={records} />
    </main>
  );
}
