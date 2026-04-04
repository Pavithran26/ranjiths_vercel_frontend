export type AuthUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
  expiresAt: string;
};

export type Employee = {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  designation: string;
  email: string;
  phoneNumber: string;
  joinedOn: string;
};

export type AttendanceSummary = {
  todayPresent: number;
  lateArrivals: number;
  remoteEmployees: number;
  attendanceRate: number;
};

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  status: "present" | "late" | "remote" | "absent";
  workedHours: number;
  checkIn: string;
  checkOut: string | null;
  notes?: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  const payload = (await response.json()) as ApiEnvelope<T> | { message?: string };

  if (!response.ok) {
    throw new Error("message" in payload && payload.message ? payload.message : "Request failed");
  }

  return (payload as ApiEnvelope<T>).data;
}

export const login = (input: { username: string; password: string }) =>
  request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });

export const getSessionUser = (token: string) =>
  request<{ user: AuthUser }>("/auth/me", undefined, token);

export const getEmployees = (token: string) => request<Employee[]>("/employees", undefined, token);

export const createEmployee = (token: string, input: Omit<Employee, "id">) =>
  request<Employee>(
    "/employees",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    token
  );

export const getAttendanceSummary = (token: string) =>
  request<AttendanceSummary>("/attendance/summary", undefined, token);

export const getAttendanceRecords = (token: string) =>
  request<AttendanceRecord[]>("/attendance/records", undefined, token);

export const createAttendance = (
  token: string,
  input: {
    employeeId: string;
    date: string;
    status: AttendanceRecord["status"];
    checkIn: string;
    checkOut?: string;
    workedHours: number;
    notes?: string;
  }
) =>
  request<AttendanceRecord>(
    "/attendance/mark",
    {
      method: "POST",
      body: JSON.stringify(input)
    },
    token
  );
