"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { StatsCard } from "../../components/stats-card";
import {
  createAttendance,
  getAttendanceRecords,
  getAttendanceSummary,
  getEmployees,
  type AttendanceRecord,
  type AttendanceSummary,
  type Employee
} from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useProtectedSession } from "../../lib/use-protected-session";

const emptySummary: AttendanceSummary = {
  todayPresent: 0,
  lateArrivals: 0,
  remoteEmployees: 0,
  attendanceRate: 0
};

const initialForm = {
  employeeId: "",
  date: "",
  status: "present" as AttendanceRecord["status"],
  checkIn: "",
  checkOut: "",
  workedHours: "0",
  notes: ""
};

export default function AttendancePage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>(emptySummary);
  const [form, setForm] = useState(initialForm);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadAttendanceData = async () => {
      try {
        const [employeeItems, attendanceItems, summaryData] = await Promise.all([
          getEmployees(session.token),
          getAttendanceRecords(session.token),
          getAttendanceSummary(session.token)
        ]);

        setEmployees(employeeItems);
        setRecords(attendanceItems);
        setSummary(summaryData);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load attendance data");
      }
    };

    void loadAttendanceData();
  }, [session]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const created = await createAttendance(session.token, {
        employeeId: form.employeeId,
        date: form.date,
        status: form.status,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        workedHours: Number(form.workedHours),
        notes: form.notes
      });

      setRecords((current) => [created, ...current]);
      setForm(initialForm);
      setSummary(await getAttendanceSummary(session.token));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="attendance"
      heading="Attendance tracker"
      description="Mark attendance only for employees already saved in the employee registry. No generated employees or attendance rows are shown."
      userName={session.user.name}
      onLogout={handleLogout}
    >
      <section className="stats-grid">
        <StatsCard label="Present today" value={String(summary.todayPresent)} helper="Present, late, and remote combined" />
        <StatsCard label="Late arrivals" value={String(summary.lateArrivals)} helper="Employees marked late today" />
        <StatsCard label="Remote" value={String(summary.remoteEmployees)} helper="Employees working off-site today" />
        <StatsCard label="Attendance rate" value={`${summary.attendanceRate}%`} helper="Rate calculated from today's marked records" />
      </section>

      <section className="content-grid">
        <article className="panel-card form-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Mark attendance</p>
              <h3>Record attendance from employee list</h3>
            </div>
          </div>

          {employees.length === 0 ? (
            <EmptyState
              title="Add employees before marking attendance"
              description="Go to the Employees screen and save at least one employee. Then this form will let you record attendance."
            />
          ) : (
            <form className="data-form two-column-form" onSubmit={handleSubmit}>
              <label className="form-span-two">
                <span>Employee</span>
                <select value={form.employeeId} onChange={(event) => updateField("employeeId", event.target.value)} required>
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} ({employee.employeeCode})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Date</span>
                <input type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} required />
              </label>

              <label>
                <span>Status</span>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)} required>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="remote">Remote</option>
                  <option value="absent">Absent</option>
                </select>
              </label>

              <label>
                <span>Check-in time</span>
                <input type="time" value={form.checkIn} onChange={(event) => updateField("checkIn", event.target.value)} required />
              </label>

              <label>
                <span>Check-out time</span>
                <input type="time" value={form.checkOut} onChange={(event) => updateField("checkOut", event.target.value)} />
              </label>

              <label>
                <span>Worked hours</span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={form.workedHours}
                  onChange={(event) => updateField("workedHours", event.target.value)}
                  required
                />
              </label>

              <label className="form-span-two">
                <span>Notes</span>
                <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} />
              </label>

              {formError ? <p className="form-error form-span-two">{formError}</p> : null}

              <button className="primary-button form-span-two" type="submit" disabled={saving}>
                {saving ? "Saving attendance..." : "Save attendance"}
              </button>
            </form>
          )}
        </article>

        <article className="panel-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attendance log</p>
              <h3>{records.length} attendance entries</h3>
            </div>
          </div>

          {pageError ? <p className="form-error">{pageError}</p> : null}

          {records.length === 0 ? (
            <EmptyState
              title="No attendance saved yet"
              description="Once you save attendance from the form, entries will appear here with the linked employee details."
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Schedule</th>
                    <th>Hours</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.employeeName}</strong>
                        <span>
                          {record.employeeCode} - {record.designation}
                        </span>
                      </td>
                      <td>{record.department}</td>
                      <td>
                        <span className={`status-chip status-${record.status}`}>{record.status}</span>
                      </td>
                      <td>
                        <strong>{record.checkIn}</strong>
                        <span>{record.checkOut ?? "Open shift"}</span>
                      </td>
                      <td>{record.workedHours.toFixed(1)}h</td>
                      <td>{record.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>
    </AppShell>
  );
}
