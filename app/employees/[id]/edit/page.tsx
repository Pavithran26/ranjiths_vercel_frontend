"use client";

import { startTransition, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

import { AppShell } from "../../../../components/app-shell";
import { EmployeeForm, type EmployeeFormValues } from "../../../../components/employee-form";
import { SectionTabs } from "../../../../components/section-tabs";
import { getEmployee, updateEmployee } from "../../../../lib/api";
import { clearStoredSession } from "../../../../lib/session";
import { useProtectedSession } from "../../../../lib/use-protected-session";

const initialForm: EmployeeFormValues = {
  employeeCode: "",
  fullName: "",
  role: "worker",
  department: "",
  designation: "",
  email: "",
  phoneNumber: "",
  dailyWage: "0",
  joinedOn: "",
  isActive: "true",
  notes: ""
};

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { loading, session } = useProtectedSession();
  const [form, setForm] = useState<EmployeeFormValues>(initialForm);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  useEffect(() => {
    if (!session || !params.id) {
      return;
    }

    const loadEmployee = async () => {
      try {
        const employee = await getEmployee(session.token, params.id);
        setForm({
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
          role: employee.role,
          department: employee.department,
          designation: employee.designation,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          dailyWage: String(employee.dailyWage),
          joinedOn: employee.joinedOn,
          isActive: String(employee.isActive),
          notes: employee.notes
        });
      } catch (error) {
        setPageError(error instanceof Error ? error.message : "Unable to load employee");
      } finally {
        setLoadingEmployee(false);
      }
    };

    void loadEmployee();
  }, [params.id, session]);

  const tabs = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/employees", label: "Employee list" },
    { href: "/employees/add", label: "Add employee" },
    { href: `/employees/${params.id}/edit`, label: "Edit employee" }
  ];

  const updateField = (field: keyof EmployeeFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogout = () => {
    clearStoredSession();
    startTransition(() => router.replace("/"));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session || !params.id) {
      return;
    }

    setSaving(true);
    setPageError("");

    try {
      await updateEmployee(session.token, params.id, {
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        role: form.role,
        department: form.department,
        designation: form.designation,
        email: form.email,
        phoneNumber: form.phoneNumber,
        dailyWage: Number(form.dailyWage),
        joinedOn: form.joinedOn,
        isActive: form.isActive === "true",
        notes: form.notes
      });
      startTransition(() => router.replace("/employees"));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to update employee");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !session || loadingEmployee) {
    return <main className="loading-screen">Checking your session...</main>;
  }

  return (
    <AppShell
      active="employees"
      heading="Edit Employee"
      description="Update worker information without leaving the ERP workspace."
      userName={session.user.name}
      userRole={session.user.role}
      onLogout={handleLogout}
    >
      <SectionTabs tabs={tabs} />
      <EmployeeForm
        eyebrow="Edit employee"
        title="Update employee details"
        submitLabel="Update employee"
        error={pageError}
        form={form}
        saving={saving}
        onChange={updateField}
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}
