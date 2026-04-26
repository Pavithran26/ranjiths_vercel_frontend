"use client";

import type { FormEvent } from "react";

export type EmployeeFormValues = {
  employeeCode: string;
  fullName: string;
  role: string;
  department: string;
  designation: string;
  phoneNumber: string;
  email: string;
  dailyWage: string;
  joinedOn: string;
  isActive: string;
  notes: string;
};

type EmployeeFormProps = {
  title: string;
  eyebrow: string;
  submitLabel: string;
  error: string;
  form: EmployeeFormValues;
  saving: boolean;
  onChange: (field: keyof EmployeeFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EmployeeForm({
  title,
  eyebrow,
  submitLabel,
  error,
  form,
  saving,
  onChange,
  onSubmit
}: EmployeeFormProps) {
  return (
    <article className="panel-card form-panel-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>

      <form className="data-form two-column-form" onSubmit={onSubmit}>
        <label>
          <span>Employee code</span>
          <input value={form.employeeCode} onChange={(event) => onChange("employeeCode", event.target.value)} required />
        </label>
        <label>
          <span>Full name</span>
          <input value={form.fullName} onChange={(event) => onChange("fullName", event.target.value)} required />
        </label>
        <label>
          <span>Department</span>
          <input value={form.department} onChange={(event) => onChange("department", event.target.value)} required />
        </label>
        <label>
          <span>Role</span>
          <select value={form.role} onChange={(event) => onChange("role", event.target.value)} required>
            <option value="worker">Worker</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          <span>Designation</span>
          <input value={form.designation} onChange={(event) => onChange("designation", event.target.value)} required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} required />
        </label>
        <label>
          <span>Phone number</span>
          <input value={form.phoneNumber} onChange={(event) => onChange("phoneNumber", event.target.value)} required />
        </label>
        <label>
          <span>Daily wage</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={String(form.dailyWage)}
            onChange={(event) => onChange("dailyWage", event.target.value)}
            required
          />
        </label>
        <label>
          <span>Joined date</span>
          <input type="date" value={form.joinedOn} onChange={(event) => onChange("joinedOn", event.target.value)} required />
        </label>
        <label>
          <span>Status</span>
          <select value={form.isActive} onChange={(event) => onChange("isActive", event.target.value)} required>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <label className="form-span-two">
          <span>Notes</span>
          <textarea rows={4} value={form.notes} onChange={(event) => onChange("notes", event.target.value)} />
        </label>

        {error ? <p className="form-error form-span-two">{error}</p> : null}

        <button className="primary-button form-span-two" type="submit" disabled={saving}>
          {saving ? "Saving employee..." : submitLabel}
        </button>
      </form>
    </article>
  );
}
