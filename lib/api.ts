export type AttendanceSummary = {
  todayPresent: number;
  lateArrivals: number;
  remoteEmployees: number;
  attendanceRate: number;
};

export type AttendanceRecord = {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  status: string;
  workedHours: number;
  checkIn: string;
  checkOut: string;
  notes?: string;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

const SUMMARY_FALLBACK: AttendanceSummary = {
  todayPresent: 0,
  lateArrivals: 0,
  remoteEmployees: 0,
  attendanceRate: 0,
};

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Backend responded with HTTP ${response.status} for ${path}`);
    }

    const payload = (await response.json()) as { data: T };
    return payload.data;
  } catch (err) {
    console.error(`[api] fetchJson failed for "${path}":`, err);
    return fallback;
  }
}

export const getAttendanceSummary = () =>
  fetchJson<AttendanceSummary>("/attendance/summary", SUMMARY_FALLBACK);

export const getAttendanceRecords = () =>
  fetchJson<AttendanceRecord[]>("/attendance/records", []);
