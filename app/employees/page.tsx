"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { ListControls } from "../../components/list-controls";
import { SectionTabs } from "../../components/section-tabs";
import { deleteEmployee, getEmployees, type Employee } from "../../lib/api";
import { clearStoredSession } from "../../lib/session";
import { useListFilters } from "../../lib/use-list-filters";
import { useProtectedSession } from "../../lib/use-protected-session";
import { ConfirmModal } from "../../components/confirm-modal";
import { DataTable, type ColumnDef } from "../../components/data-table";
import { FaEdit, FaTrash } from "react-icons/fa";

const employeeTabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/employees", label: "Employee list" },
  { href: "/employees/add", label: "Add employee" }
];

export default function EmployeesPage() {
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const { pageSize, startDate, endDate, setPageSize, setStartDate, setEndDate, appliedParams, handleApply, handleClear } = useListFilters();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageError, setPageError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const loadEmployees = async () => {
      try {
        const params: Record<string, string | number> = {};
        if (appliedParams.pageSize === "all") {
          params.page_size = 10000;
        } else {
          params.page_size = appliedParams.pageSize;
        }
        if (appliedParams.startDate) params.joined_on__gte = appliedParams.startDate;
        if (appliedParams.endDate) params.joined_on__lte = appliedParams.endDate;

        setEmployees(await getEmployees(session.token, params));
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load employees");
      }
    };

    void loadEmployees();
  }, [session, appliedParams]);

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const confirmDelete = async () => {
    if (!session || !employeeToDelete) return;

    setDeletingId(employeeToDelete.id);
    setPageError("");

    try {
      await deleteEmployee(session.token, employeeToDelete.id);
      setEmployees((current) => current.filter((item) => item.id !== employeeToDelete.id));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to delete employee");
    } finally {
      setDeletingId("");
      setEmployeeToDelete(null);
    }
  };

  if (loading || !session) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  const departments = new Set(employees.map((employee) => employee.department.trim()).filter(Boolean)).size;

  return (
    <AppShell
      active="employees"
      heading="Employee List"
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
      <ConfirmModal
        isOpen={!!employeeToDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employeeToDelete?.fullName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setEmployeeToDelete(null)}
      />
      <SectionTabs tabs={employeeTabs} />

      <article className="panel-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Master register</p>
            <h3>Employee list</h3>
            <p className="panel-description">Manage field staff records and contact details.</p>
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

        <ListControls
          pageSize={pageSize}
          startDate={startDate}
          endDate={endDate}
          onPageSizeChange={setPageSize}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onFilterApply={handleApply}
          onFilterClear={handleClear}
        />

        <DataTable
          columns={[
            {
              header: "Employee",
              render: (employee) => (
                <>
                  <strong>{employee.fullName}</strong>
                  <span>{employee.employeeCode}</span>
                </>
              )
            },
            { header: "Department", accessor: "department" },
            { header: "Role", accessor: "role" },
            { header: "Designation", accessor: "designation" },
            {
              header: "Contact",
              render: (employee) => (
                <>
                  <strong>{employee.email}</strong>
                  <span>{employee.phoneNumber}</span>
                </>
              )
            },
            {
              header: "Wage",
              render: (employee) => `Rs ${employee.dailyWage.toFixed(0)}`
            },
            { header: "Joined", accessor: "joinedOn" },
            {
              header: "Actions",
              render: (employee) => (
                <div className="table-actions">
                  <Link
                    className="secondary-button table-button"
                    href={`/employees/${employee.id}/edit`}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    <FaEdit size={16} />
                  </Link>
                  <button
                    className="danger-button table-button"
                    type="button"
                    disabled={deletingId === employee.id}
                    onClick={() => setEmployeeToDelete(employee)}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0.5rem" }}
                  >
                    {deletingId === employee.id ? "..." : <FaTrash size={16} />}
                  </button>
                </div>
              )
            }
          ]}
          data={employees}
          keyExtractor={(item) => item.id}
          emptyState={
            <>
              <EmptyState
                title="No employees added yet"
                description="Create your first field worker record, then manage the full list from this ERP-style register."
              />
              <Link className="secondary-button" href="/employees/add">
                Go to add employee
              </Link>
            </>
          }
        />
      </article>
    </AppShell>
  );
}
