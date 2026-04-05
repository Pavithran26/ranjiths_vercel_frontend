"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { SectionTabs } from "../../components/section-tabs";
import { deleteEmployee, getEmployees, type Employee } from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useProtectedSession } from "../../lib/use-protected-session";

const employeeTabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employee list" },
  { href: "/employees/add", label: "Add employee" }
];

export default function EmployeesPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadEmployees = async () => {
      try {
        setEmployees(await getEmployees(session.token));
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load employees");
      }
    };

    void loadEmployees();
  }, [session]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleDelete = async (employee: Employee) => {
    if (!session || !window.confirm(`Delete ${employee.fullName}?`)) {
      return;
    }

    setDeletingId(employee.id);
    setPageError("");

    try {
      await deleteEmployee(session.token, employee.id);
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete employee");
    } finally {
      setDeletingId("");
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  const departments = new Set(employees.map((employee) => employee.department.trim()).filter(Boolean)).size;

  return (
    <AppShell
      active="employees"
      heading="Employee Master"
      description="Maintain the field workforce register that powers work assignment, wages, supervisors, and profit reporting."
      userName={session.user.name}
      userRole={session.user.role}
      action={
        <Link className="primary-button" href="/employees/add">
          Add employee
        </Link>
      }
      onLogout={handleLogout}
    >
      <SectionTabs tabs={employeeTabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Master register</p>
            <h3>Employee list</h3>
            <p className="panel-description">A clean table view for crew records, contact details, and job assignment basics.</p>
          </div>
        </div>

        <div className="insight-strip">
          <div className="insight-card">
            <span>Registered workers</span>
            <strong>{employees.length}</strong>
            <p>Total saved in the master list</p>
          </div>
          <div className="insight-card">
            <span>Departments</span>
            <strong>{departments}</strong>
            <p>Distinct work groups in the register</p>
          </div>
          <div className="insight-card">
            <span>Supervisors</span>
            <strong>{employees.filter((employee) => employee.role === "supervisor").length}</strong>
            <p>Supervisors available for work log assignment</p>
          </div>
          <div className="insight-card">
            <span>Active workers</span>
            <strong>{employees.filter((employee) => employee.isActive).length}</strong>
            <p>Employee master is ready for work logs and wages</p>
          </div>
        </div>

        {pageError ? <p className="form-error">{pageError}</p> : null}

        {employees.length === 0 ? (
          <div className="empty-state-stack">
            <EmptyState
              title="No employees added yet"
              description="Create your first field worker record, then manage the full list from this ERP-style register."
            />
            <Link className="secondary-button" href="/employees/add">
              Go to add employee
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Wage</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <strong>{employee.fullName}</strong>
                      <span>{employee.employeeCode}</span>
                    </td>
                    <td>{employee.department}</td>
                    <td>{employee.role}</td>
                    <td>{employee.designation}</td>
                    <td>
                      <strong>{employee.email}</strong>
                      <span>{employee.phoneNumber}</span>
                    </td>
                    <td>Rs {employee.dailyWage.toFixed(0)}</td>
                    <td>{employee.joinedOn}</td>
                    <td>
                      <div className="table-actions">
                        <Link className="secondary-button table-button" href={`/employees/${employee.id}/edit`}>
                          Edit
                        </Link>
                        <button
                          className="danger-button table-button"
                          type="button"
                          disabled={deletingId === employee.id}
                          onClick={() => handleDelete(employee)}
                        >
                          {deletingId === employee.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
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
